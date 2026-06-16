/**
 * Agent Tester — TCG Bindex
 *
 * Testa todas as 16 rotas da API em sequência, usando dados reais do banco.
 * Executa como GitHub Action diariamente e gera relatório no GitHub Summary.
 *
 * Requisito: variável de ambiente CLERK_TEST_TOKEN com JWT de conta de teste.
 */

const BASE_URL = process.env.AGENT_TESTER_BASE_URL || 'https://tcg-collector-app-production.up.railway.app';
const TOKEN = process.env.CLERK_TEST_TOKEN || '';

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

// ─── Utilitários ──────────────────────────────────────────────────────────────

const results: TestResult[] = [];

async function checkRoute(
  name: string,
  method: string,
  path: string,
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
    if (!TOKEN) {
      results.push({ route: path, method, name, status: 'skip', note: 'CLERK_TEST_TOKEN não configurado' });
      return { ok: false, body: null, status: 0 };
    }
    headers['Authorization'] = `Bearer ${TOKEN}`;
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

    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => '');
    }

    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const pass = expected.includes(httpStatus);

    results.push({
      route: path,
      method,
      name,
      status: pass ? 'pass' : 'fail',
      httpStatus,
      latencyMs,
      note,
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

async function runAll() {
  console.log(`\n🤖 Agent Tester — TCG Bindex`);
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 Token: ${TOKEN ? '✓ configurado' : '✗ ausente'}\n`);

  // IDs capturados dinamicamente durante os testes
  let firstCardId = '';
  let createdBinderId = '';
  let createdCollectionEntryId = '';

  // ── 1. Saúde (público) ────────────────────────────────────────────────────
  await checkRoute('Servidor vivo e respondendo', 'GET', '/health', { auth: false, expectedStatus: 200 });

  // ── 2. Sets ───────────────────────────────────────────────────────────────
  await checkRoute('Listar todos os sets', 'GET', '/api/sets', { expectedStatus: 200 });

  // ── 3. Cards (busca) ──────────────────────────────────────────────────────
  const cardsRes = await checkRoute('Buscar cartas por nome', 'GET', '/api/cards?name=Pikachu&limit=1', { expectedStatus: 200 });
  if (cardsRes.ok && cardsRes.body) {
    const b = cardsRes.body as { data?: Array<{ _id?: string; id?: string }> };
    const first = Array.isArray(b.data) && b.data[0];
    if (first) firstCardId = String(first._id ?? first.id ?? '');
  }

  // ── 4. Detalhe de carta ───────────────────────────────────────────────────
  if (firstCardId) {
    await checkRoute('Detalhe completo de uma carta', 'GET', `/api/cards/${firstCardId}`, { expectedStatus: 200 });
  } else {
    results.push({ route: '/api/cards/:id', method: 'GET', name: 'Detalhe completo de uma carta', status: 'skip', note: 'Nenhum card ID capturado da busca' });
  }

  // ── 5. Coleção ────────────────────────────────────────────────────────────
  await checkRoute('Listar coleção do usuário', 'GET', '/api/collections', { expectedStatus: 200 });

  // ── 6. Preços ─────────────────────────────────────────────────────────────
  await checkRoute('Cotação USD→BRL', 'GET', '/api/prices/exchange', { expectedStatus: 200 });

  if (firstCardId) {
    await checkRoute('Preço de mercado de carta específica', 'GET', `/api/prices/${firstCardId}`, { expectedStatus: [200, 404], note: 'Carta pode não ter preço cadastrado' });
  } else {
    results.push({ route: '/api/prices/:cardId', method: 'GET', name: 'Preço de mercado de carta específica', status: 'skip', note: 'Nenhum card ID capturado da busca' });
  }

  // ── 7. Binders ───────────────────────────────────────────────────────────
  await checkRoute('Listar binders do usuário', 'GET', '/api/binders', { expectedStatus: 200 });

  // Criar binder de teste
  const createBinderRes = await checkRoute('Criar novo binder', 'POST', '/api/binders', {
    body: { name: '[AGENT-TESTER] Binder de Teste Sintético', coverColor: '#3266ad' },
    expectedStatus: [200, 201],
  });
  if (createBinderRes.ok && createBinderRes.body) {
    const b = createBinderRes.body as { _id?: string; id?: string; binder?: { _id?: string } };
    createdBinderId = String(b._id ?? b.id ?? b.binder?._id ?? '');
  }

  if (createdBinderId) {
    await checkRoute('Abrir binder com páginas e slots', 'GET', `/api/binders/${createdBinderId}`, { expectedStatus: 200 });

    await checkRoute('Adicionar página ao binder', 'POST', `/api/binders/${createdBinderId}/pages`, {
      body: {},
      expectedStatus: [200, 201],
    });

    if (firstCardId) {
      await checkRoute('Colocar carta em slot do binder', 'PATCH', `/api/binders/${createdBinderId}/slots/0`, {
        body: { cardId: firstCardId },
        expectedStatus: [200, 201],
      });
    } else {
      results.push({ route: '/api/binders/:id/slots/:pos', method: 'PATCH', name: 'Colocar carta em slot do binder', status: 'skip', note: 'Nenhum card ID disponível' });
    }
  } else {
    results.push({ route: '/api/binders/:id', method: 'GET', name: 'Abrir binder com páginas e slots', status: 'skip', note: 'Binder não foi criado' });
    results.push({ route: '/api/binders/:id/pages', method: 'POST', name: 'Adicionar página ao binder', status: 'skip', note: 'Binder não foi criado' });
    results.push({ route: '/api/binders/:id/slots/:pos', method: 'PATCH', name: 'Colocar carta em slot do binder', status: 'skip', note: 'Binder não foi criado' });
  }

  // ── 8. Adicionar à coleção ────────────────────────────────────────────────
  if (firstCardId) {
    const addColRes = await checkRoute('Adicionar carta à coleção', 'POST', '/api/collections', {
      body: { cardId: firstCardId, condition: 'NM', quantity: 1 },
      expectedStatus: [200, 201],
    });
    if (addColRes.ok && addColRes.body) {
      const b = addColRes.body as { _id?: string; id?: string };
      createdCollectionEntryId = String(b._id ?? b.id ?? '');
    }
  } else {
    results.push({ route: '/api/collections', method: 'POST', name: 'Adicionar carta à coleção', status: 'skip', note: 'Nenhum card ID disponível' });
  }

  // ── 9. Scan (rota protegida — envia payload mínimo) ───────────────────────
  // Espera 400 (payload inválido) ou 422 (não identificou) — ambos confirmam que a rota está ativa e autenticada
  await checkRoute('Scan de carta pela câmera (rota acessível)', 'POST', '/api/scan', {
    body: { image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
    expectedStatus: [400, 422, 429, 200],
    note: 'Payload sintético — confirma que rota está ativa e autenticada',
  });

  // ── 10. Limpeza (DELETE) ───────────────────────────────────────────────────
  if (createdCollectionEntryId) {
    await checkRoute('Remover carta da coleção (cleanup)', 'DELETE', `/api/collections/${createdCollectionEntryId}`, {
      expectedStatus: [200, 204],
    });
  } else {
    results.push({ route: '/api/collections/:id', method: 'DELETE', name: 'Remover carta da coleção (cleanup)', status: 'skip', note: 'Nenhum entry ID para deletar' });
  }

  if (createdBinderId) {
    await checkRoute('Excluir binder (cleanup)', 'DELETE', `/api/binders/${createdBinderId}`, {
      expectedStatus: [200, 204],
    });
  } else {
    results.push({ route: '/api/binders/:id', method: 'DELETE', name: 'Excluir binder (cleanup)', status: 'skip', note: 'Nenhum binder ID para deletar' });
  }

  return results;
}

// ─── Relatório ────────────────────────────────────────────────────────────────

function buildReport(results: TestResult[]): string {
  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const skip = results.filter(r => r.status === 'skip').length;
  const total = results.length;

  const icon = (s: TestResult['status']) =>
    s === 'pass' ? '✅' : s === 'fail' ? '❌' : '⏭️';

  const avg = (arr: TestResult[]) => {
    const times = arr.filter(r => r.latencyMs !== undefined).map(r => r.latencyMs!);
    return times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  };

  const lines: string[] = [
    `# 🤖 Agent Tester — Relatório Sintético`,
    ``,
    `**Data:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (BRT)`,
    `**Base URL:** ${BASE_URL}`,
    ``,
    `## Resumo`,
    ``,
    `| | Rotas |`,
    `|--|--|`,
    `| ✅ Passou | ${pass}/${total} |`,
    `| ❌ Falhou | ${fail}/${total} |`,
    `| ⏭️ Pulou | ${skip}/${total} |`,
    `| ⏱️ Latência média | ${avg(results) ?? 'N/A'} ms |`,
    ``,
    `## Resultados por rota`,
    ``,
    `| Status | Método | Rota | Nome | HTTP | ms | Nota |`,
    `|--------|--------|------|------|------|----|------|`,
  ];

  for (const r of results) {
    const latency = r.latencyMs !== undefined ? `${r.latencyMs}` : '—';
    const note = r.error ? `⚠️ ${r.error}` : (r.note ?? '');
    lines.push(`| ${icon(r.status)} | \`${r.method}\` | \`${r.route}\` | ${r.name} | ${r.httpStatus ?? '—'} | ${latency} | ${note} |`);
  }

  if (fail > 0) {
    lines.push(``, `## ❌ Falhas detectadas`, ``);
    for (const r of results.filter(r => r.status === 'fail')) {
      lines.push(`### \`${r.method} ${r.route}\``);
      lines.push(`- **Erro:** ${r.error ?? 'Sem detalhes'}`);
      lines.push(`- **HTTP Status:** ${r.httpStatus ?? '—'}`);
      lines.push(``);
    }
  }

  lines.push(`---`);
  lines.push(`*Gerado pelo Agent Tester do TCG Bindex*`);

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const results = await runAll();
    const report = buildReport(results);

    // Exibe no console
    console.log('\n' + report);

    // Escreve no GitHub Step Summary (se disponível)
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      const { appendFileSync } = await import('fs');
      appendFileSync(summaryFile, report + '\n');
    }

    // Sai com erro se qualquer rota FALHOU (skip não conta como falha)
    const failed = results.filter(r => r.status === 'fail').length;
    if (failed > 0) {
      console.error(`\n❌ ${failed} rota(s) falharam.`);
      process.exit(1);
    } else {
      console.log(`\n✅ Todas as rotas testadas passaram.`);
    }
  } catch (err) {
    console.error('Erro fatal no Agent Tester:', err);
    process.exit(1);
  }
})();
