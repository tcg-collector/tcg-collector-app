/**
 * Agent Tester — TCG Bindex
 *
 * Testa todas as 16 rotas da API em sequência, usando dados reais do banco.
 * Executa como GitHub Action diariamente e gera relatório no GitHub Summary.
 *
 * Auth: gera token fresco a cada execução via Clerk Backend + Frontend API.
 * Sem necessidade de sessão ativa ou login pelo app.
 */

const BASE_URL = process.env.AGENT_TESTER_BASE_URL || 'https://tcg-collector-app-production.up.railway.app';

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
      'Clerk-API-Version': '2025-01-17',
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
  } = {}
): Promise<{ ok: boolean; body: unknown; status: number }> {
  const { auth = true, expectedStatus = [200, 201], note } = opts;
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
      signal: AbortSignal.timeout(15_000),
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

  await checkRoute('Scan de carta (rota acessível e autenticada)', 'POST', '/api/scan', token, {
    body: { image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
    expectedStatus: [400, 422, 429, 200],
    note: 'Payload sintético — confirma rota ativa e autenticada',
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

  lines.push(`---`, `*Agent Tester do TCG Bindex*`);
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const token = await resolveToken();
    await runAll(token);
    const report = buildReport();

    console.log('\n' + report);

    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      const { appendFileSync } = await import('fs');
      appendFileSync(summaryFile, report + '\n');
    }

    const failed = results.filter(r => r.status === 'fail').length;
    if (failed > 0) { console.error(`\n❌ ${failed} rota(s) falharam.`); process.exit(1); }
    else { console.log(`\n✅ Todas as rotas testadas passaram.`); }
  } catch (err) {
    console.error('Erro fatal no Agent Tester:', err);
    process.exit(1);
  }
})();
