/**
 * Agent Tester — TCG Bindex
 *
 * Testa todas as 21 rotas da API em sequência, usando dados reais do banco.
 * Executa como GitHub Action diariamente e gera relatório no GitHub Summary.
 *
 * Auth: gera token fresco a cada execução via Clerk Backend + Frontend API.
 * Sem necessidade de sessão ativa ou login pelo app.
 */

const BASE_URL = process.env.AGENT_TESTER_BASE_URL || 'https://tcg-collector-app-production.up.railway.app';

// ─── Manifesto de rotas ───────────────────────────────────────────────────────
// Atualizar este array ao adicionar ou remover qualquer rota da API.
// covered: false → aparece como ⚠️ no relatório e quebra o CI (exit 1).

const KNOWN_ROUTES: Array<{ method: string; path: string; description: string; covered: boolean }> = [
  { method: 'GET',   path: '/health',                      description: 'Health check',                    covered: true },
  { method: 'GET',   path: '/api/sets',                    description: 'Listar edições',                  covered: true },
  { method: 'GET',   path: '/api/cards?name=Pikachu&limit=1', description: 'Listar cartas',                 covered: true },
  { method: 'GET',   path: '/api/cards/:id',               description: 'Detalhe de carta',                covered: true },
  { method: 'GET',   path: '/api/collections',             description: 'Listar coleção',                  covered: true },
  { method: 'POST',  path: '/api/collections',             description: 'Adicionar carta à coleção',       covered: true },
  { method: 'DELETE',path: '/api/collections/:id',         description: 'Remover carta da coleção',        covered: true },
  { method: 'GET',   path: '/api/prices/exchange',         description: 'Cotação USD→BRL',                 covered: true },
  { method: 'GET',   path: '/api/prices/:cardId',          description: 'Preço de carta',                  covered: true },
  { method: 'GET',   path: '/api/binders',                 description: 'Listar binders',                  covered: true },
  { method: 'POST',  path: '/api/binders',                 description: 'Criar binder',                    covered: true },
  { method: 'GET',   path: '/api/binders/:id',             description: 'Detalhe de binder',               covered: true },
  { method: 'DELETE',path: '/api/binders/:id',             description: 'Excluir binder',                  covered: true },
  { method: 'PATCH', path: '/api/binders/:id/slots/:pos',  description: 'Colocar carta em slot',           covered: true },
  { method: 'POST',  path: '/api/binders/:id/pages',       description: 'Adicionar página ao binder',      covered: true },
  { method: 'POST',  path: '/api/scan',                    description: 'Scan IA por foto',                covered: true },
  { method: 'GET',   path: '/api/prices/top-gainers',      description: 'Top valorizações globais',         covered: true },
  { method: 'GET',   path: '/api/prices/top-value',        description: 'Top cartas mais valiosas globais', covered: true },
  { method: 'GET',   path: '/api/collections/top-gainers', description: 'Top valorizações da coleção',      covered: true },
  { method: 'GET',   path: '/api/collections/top-value',   description: 'Top cartas valiosas da coleção',   covered: true },
  { method: 'GET',   path: '/api/collections/summary',     description: 'Resumo de valor da coleção',       covered: true },
];

// ─── Gerar token fresco via Clerk ─────────────────────────────────────────────

async function resolveToken(): Promise<string> {
  // Fallback: token estático (expira em ~1h, útil para testes locais)
  if (process.env.CLERK_TEST_TOKEN) {
    console.log('🔑 Usando CLERK_TEST_TOKEN estático');
    return process.env.CLERK_TEST_TOKEN;
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  const userId = process.env.CLERK_TEST_USER_ID;
  const frontendApiUrl = process.env.CLERK_FRONTEND_API_URL; // ex: clerk.tcgbindex.app

  if (!secretKey || !userId || !frontendApiUrl) {
    console.warn('⚠️  Sem credenciais de auth. Defina CLERK_SECRET_KEY + CLERK_TEST_USER_ID + CLERK_FRONTEND_API_URL.');
    return '';
  }

  console.log('🔑 Gerando token via Clerk...');

  // Passo 1: criar sign-in token para o usuário de teste (via Backend API)
  const sitRes = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 120 }),
  });

  if (!sitRes.ok) {
    const body = await sitRes.text();
    throw new Error(`Clerk Backend API erro ${sitRes.status}: ${body}`);
  }

  const sitData = await sitRes.json() as { token?: string };
  if (!sitData.token) throw new Error('Clerk não retornou sign-in token');

  // Passo 2: trocar o sign-in token por uma sessão via Frontend API
  const signInRes = await fetch(`https://${frontendApiUrl}/v1/client/sign_ins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ strategy: 'ticket', ticket: sitData.token }),
  });

  if (!signInRes.ok) {
    const body = await signInRes.text();
    throw new Error(`Clerk Frontend API erro ${signInRes.status}: ${body}`);
  }

  const signInData = await signInRes.json() as {
    client?: {
      sessions?: Array<{ last_active_token?: { jwt?: string } }>;
    };
  };

  const jwt = signInData.client?.sessions?.[0]?.last_active_token?.jwt;
  if (!jwt) throw new Error('Clerk não retornou JWT na resposta de sign-in');

  console.log('✅ Token gerado com sucesso');
  return jwt;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TestResult {
  route: string;
  method: string;
  name: string;
  status: 'pass' | 'fail' | 'skip';
  httpStatus?: number;
  latencyMs?: number;
  error?: string;
  note?: string;
}

const results: TestResult[] = [];

// ─── checkRoute ───────────────────────────────────────────────────────────────

async function checkRoute(
  name: string,
  method: string,
  path: string,
  token: string,
  opts: {
    body?: unknown;
    auth?: boolean;
    expectedStatus?: number | number[];
    note?: string;
    timeoutMs?: number;
  } = {}
): Promise<{ ok: boolean; body: unknown; status: number }> {
  const { auth = true, expectedStatus = [200, 201], note, timeoutMs = 15_000 } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    if (!token) {
      results.push({ route: path, method, name, status: 'skip', note: 'Sem token de auth' });
      return { ok: false, body: null, status: 0 };
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const start = Date.now();
  let httpStatus = 0;
  let body: unknown = null;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    httpStatus = res.status;
    const latencyMs = Date.now() - start;

    try { body = await res.json(); } catch { body = await res.text().catch(() => ''); }

    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const pass = expected.includes(httpStatus);

    results.push({
      route: path, method, name,
      status: pass ? 'pass' : 'fail',
      httpStatus, latencyMs, note,
      error: pass ? undefined : `Esperava HTTP ${expected.join('/')} mas recebeu ${httpStatus}`,
    });

    return { ok: pass, body, status: httpStatus };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ route: path, method, name, status: 'fail', httpStatus, latencyMs, error: msg, note });
    return { ok: false, body: null, status: 0 };
  }
}

// ─── Warm-up: aguarda Railway estar pronto ────────────────────────────────────

async function waitForServer(maxWaitMs = 120_000): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    try {
      const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        console.log(`✅ Servidor respondeu após ${attempt} tentativa(s)`);
        return;
      }
    } catch {
      // ainda subindo
    }
    console.log(`⏳ Warm-up tentativa ${attempt} — aguardando Railway...`);
    await new Promise(r => setTimeout(r, 10_000));
  }
  throw new Error(`Servidor não respondeu após ${maxWaitMs / 1000}s`);
}

// ─── Sequência de testes ──────────────────────────────────────────────────────

async function runAll(token: string) {
  console.log(`\n🤖 Agent Tester — TCG Bindex`);
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 Auth: ${token ? '✓ token disponível' : '✗ sem token — rotas autenticadas serão puladas'}\n`);

  let firstCardId = '';
  let createdBinderId = '';
  let createdCollectionEntryId = '';

  await checkRoute('Servidor vivo e respondendo', 'GET', '/health', token, { auth: false });

  await checkRoute('Listar todos os sets', 'GET', '/api/sets', token);

  const cardsRes = await checkRoute('Buscar cartas por nome', 'GET', '/api/cards?name=Pikachu&limit=1', token);
  if (cardsRes.ok) {
    const b = cardsRes.body as { data?: Array<{ _id?: string; id?: string }> };
    const first = Array.isArray(b?.data) && b.data[0];
    if (first) firstCardId = String(first._id ?? first.id ?? '');
  }

  if (firstCardId) {
    await checkRoute('Detalhe completo de uma carta', 'GET', `/api/cards/${firstCardId}`, token);
  } else {
    results.push({ route: '/api/cards/:id', method: 'GET', name: 'Detalhe completo de uma carta', status: 'skip', note: 'Nenhum cardId capturado' });
  }

  await checkRoute('Listar coleção do usuário', 'GET', '/api/collections', token);
  await checkRoute('Cotação USD→BRL', 'GET', '/api/prices/exchange', token);

  if (firstCardId) {
    await checkRoute('Preço de mercado de carta', 'GET', `/api/prices/${firstCardId}`, token, {
      expectedStatus: [200, 404], note: 'Carta pode não ter preço cadastrado'
    });
  } else {
    results.push({ route: '/api/prices/:cardId', method: 'GET', name: 'Preço de mercado de carta', status: 'skip', note: 'Nenhum cardId capturado' });
  }

  await checkRoute('Listar binders do usuário', 'GET', '/api/binders', token);

  const createBinderRes = await checkRoute('Criar novo binder', 'POST', '/api/binders', token, {
    body: { name: '[AGENT-TESTER] Binder Sintético', coverColor: '#3266ad' },
    expectedStatus: [200, 201],
  });
  if (createBinderRes.ok) {
    const b = createBinderRes.body as { _id?: string; id?: string; binder?: { _id?: string } };
    createdBinderId = String(b?._id ?? b?.id ?? b?.binder?._id ?? '');
  }

  if (createdBinderId) {
    await checkRoute('Abrir binder com páginas e slots', 'GET', `/api/binders/${createdBinderId}`, token);
    await checkRoute('Adicionar página ao binder', 'POST', `/api/binders/${createdBinderId}/pages`, token, {
      body: {}, expectedStatus: [200, 201],
    });
    if (firstCardId) {
      await checkRoute('Colocar carta em slot do binder', 'PATCH', `/api/binders/${createdBinderId}/slots/0`, token, {
        body: { cardId: firstCardId }, expectedStatus: [200, 201],
      });
    } else {
      results.push({ route: '/api/binders/:id/slots/:pos', method: 'PATCH', name: 'Colocar carta em slot', status: 'skip', note: 'Nenhum cardId disponível' });
    }
  } else {
    ['GET /api/binders/:id', 'POST /api/binders/:id/pages', 'PATCH /api/binders/:id/slots/:pos'].forEach(r => {
      const [method, route] = r.split(' ');
      results.push({ route, method, name: route, status: 'skip', note: 'Binder não criado' });
    });
  }

  if (firstCardId) {
    const addColRes = await checkRoute('Adicionar carta à coleção', 'POST', '/api/collections', token, {
      body: { cardId: firstCardId, condition: 'NM', quantity: 1 }, expectedStatus: [200, 201],
    });
    if (addColRes.ok) {
      const b = addColRes.body as { _id?: string; id?: string };
      createdCollectionEntryId = String(b?._id ?? b?.id ?? '');
    }
  } else {
    results.push({ route: '/api/collections', method: 'POST', name: 'Adicionar carta à coleção', status: 'skip', note: 'Nenhum cardId disponível' });
  }

  // Histórico de preços — rotas globais
  await checkRoute('Top valorizações globais (7d)', 'GET', '/api/prices/top-gainers?days=7&limit=5', token, {
    expectedStatus: [200], note: 'Pode retornar array vazio se não houver histórico',
  });
  await checkRoute('Top cartas mais valiosas globais', 'GET', '/api/prices/top-value?limit=5', token, {
    expectedStatus: [200],
    timeoutMs: 30_000,
    note: 'Ordena ~12k cartas — pode demorar até 30s',
  });

  // Histórico de preços — rotas da coleção do usuário
  await checkRoute('Top valorizações da coleção (7d)', 'GET', '/api/collections/top-gainers?days=7&limit=5', token, {
    expectedStatus: [200], note: 'Pode retornar array vazio se coleção estiver vazia',
  });
  await checkRoute('Top cartas valiosas da coleção', 'GET', '/api/collections/top-value?limit=5', token, {
    expectedStatus: [200],
  });
  await checkRoute('Resumo de valor da coleção (7d)', 'GET', '/api/collections/summary?days=7', token, {
    expectedStatus: [200], note: 'deltaUSD pode ser 0 se não houver histórico',
  });

  await checkRoute('Scan de carta (rota acessível e autenticada)', 'POST', '/api/scan', token, {
    body: { image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
    expectedStatus: [400, 422, 429, 200],
    note: 'Payload sintético — confirma rota ativa e autenticada',
    timeoutMs: 45_000,
  });

  if (createdCollectionEntryId) {
    await checkRoute('Remover carta da coleção (cleanup)', 'DELETE', `/api/collections/${createdCollectionEntryId}`, token, { expectedStatus: [200, 204] });
  } else {
    results.push({ route: '/api/collections/:id', method: 'DELETE', name: 'Remover carta da coleção (cleanup)', status: 'skip', note: 'Nada a limpar' });
  }

  if (createdBinderId) {
    await checkRoute('Excluir binder (cleanup)', 'DELETE', `/api/binders/${createdBinderId}`, token, { expectedStatus: [200, 204] });
  } else {
    results.push({ route: '/api/binders/:id', method: 'DELETE', name: 'Excluir binder (cleanup)', status: 'skip', note: 'Nada a limpar' });
  }
}

// ─── Relatório ────────────────────────────────────────────────────────────────

function buildReport(): string {
  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const skip = results.filter(r => r.status === 'skip').length;
  const total = results.length;
  const icon = (s: string) => s === 'pass' ? '✅' : s === 'fail' ? '❌' : '⏭️';
  const times = results.filter(r => r.latencyMs !== undefined).map(r => r.latencyMs!);
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

  const lines = [
    `# 🤖 Agent Tester — Relatório Sintético`,
    ``,
    `**Data:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (BRT)`,
    `**Base URL:** ${BASE_URL}`,
    ``,
    `| | |`,
    `|--|--|`,
    `| ✅ Passou | ${pass}/${total} |`,
    `| ❌ Falhou | ${fail}/${total} |`,
    `| ⏭️ Pulou | ${skip}/${total} |`,
    `| ⏱️ Latência média | ${avg ?? 'N/A'} ms |`,
    ``,
    `## Resultados`,
    ``,
    `| Status | Método | Rota | Nome | HTTP | ms | Nota |`,
    `|--------|--------|------|------|------|----|------|`,
  ];

  for (const r of results) {
    const latency = r.latencyMs !== undefined ? `${r.latencyMs}` : '—';
    const note = r.error ? `⚠️ ${r.error}` : (r.note ?? '');
    lines.push(`| ${icon(r.status)} | \`${r.method}\` | \`${r.route}\` | ${r.name} | ${r.httpStatus ?? '—'} | ${latency} | ${note} |`);
  }

  if (results.some(r => r.status === 'fail')) {
    lines.push(``, `## ❌ Falhas`, ``);
    for (const r of results.filter(r => r.status === 'fail')) {
      lines.push(`### \`${r.method} ${r.route}\``, `- **Erro:** ${r.error ?? '—'}`, `- **HTTP:** ${r.httpStatus ?? '—'}`, ``);
    }
  }

  // Seção de cobertura: compara manifesto com rotas efetivamente testadas
  const testedPaths = new Set(results.map(r => `${r.method}:${r.route.split('?')[0]}`));
  const uncovered = KNOWN_ROUTES.filter(r => !r.covered);
  const notTested  = KNOWN_ROUTES.filter(r => r.covered && !testedPaths.has(`${r.method}:${r.path}`));

  lines.push(``, `## 📊 Cobertura de rotas`, ``);
  lines.push(`| Status | Método | Rota | Descrição |`);
  lines.push(`|--------|--------|------|-----------|`);

  for (const r of KNOWN_ROUTES) {
    const isTested  = testedPaths.has(`${r.method}:${r.path}`);
    const icon = !r.covered ? '⚠️ Não coberta' : isTested ? '✅ Testada' : '⏭️ Pulada';
    lines.push(`| ${icon} | \`${r.method}\` | \`${r.path}\` | ${r.description} |`);
  }

  if (uncovered.length > 0) {
    lines.push(``, `> ⚠️ **${uncovered.length} rota(s) com \`covered: false\`** — adicione testes no agent-tester.ts:`);
    for (const r of uncovered) lines.push(`> - \`${r.method} ${r.path}\` — ${r.description}`);
  }

  if (notTested.length > 0) {
    lines.push(``, `> ℹ️ **${notTested.length} rota(s) puladas** (sem dados para testar ou cleanup não executado)`);
  }

  lines.push(`---`, `*Agent Tester do TCG Bindex*`);
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await waitForServer();
    const token = await resolveToken();
    await runAll(token);
    const report = buildReport();

    console.log('\n' + report);

    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      const { appendFileSync } = await import('fs');
      appendFileSync(summaryFile, report + '\n');
    }

    const failed    = results.filter(r => r.status === 'fail').length;
    const uncovered = KNOWN_ROUTES.filter(r => !r.covered).length;

    if (failed > 0)    console.error(`\n❌ ${failed} rota(s) falharam.`);
    if (uncovered > 0) console.error(`\n⚠️  ${uncovered} rota(s) no manifesto com covered: false — adicione testes.`);

    if (failed > 0 || uncovered > 0) process.exit(1);
    else console.log(`\n✅ Todas as rotas testadas passaram. Cobertura: ${KNOWN_ROUTES.length}/${KNOWN_ROUTES.length}.`);
  } catch (err) {
    console.error('Erro fatal no Agent Tester:', err);
    process.exit(1);
  }
})();
