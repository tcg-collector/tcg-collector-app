---
name: check-agent-tester
description: >
  Verifica se o agent tester cobre todas as rotas da API. Lê o agent-tester.ts
  e as rotas em backend/src/routes/, compara, lista lacunas e propõe os blocos
  de teste a adicionar. Após aprovação, adiciona os testes e faz /ship.
  Use quando adicionar novas rotas ou suspeitar que o agent tester está desatualizado.
---

# Check Agent Tester — Auditoria de Cobertura

Compara as rotas reais da API com o manifesto e os testes implementados no agent tester.

## Passo 1 — Ler o agent tester atual

Leia `backend/src/scripts/agent-tester.ts` completo.

Extraia:
- O array `KNOWN_ROUTES` (manifesto declarado)
- Todas as chamadas `fetch(` ou `request(` dentro das funções de teste (rotas efetivamente exercidas)

## Passo 2 — Ler todas as rotas reais

Leia todos os arquivos em `backend/src/routes/` e identifique cada rota registrada:
- Método HTTP (`router.get`, `router.post`, `router.patch`, `router.delete`, etc.)
- Path relativo (ex: `/`, `/:id`, `/:id/slots/:position`)

Combine com o prefixo registrado em `backend/src/index.ts` (ex: `/api/binders`, `/api/collections`) para obter o path completo.

Também leia `backend/src/index.ts` para capturar rotas registradas diretamente no app (ex: `/health`).

## Passo 3 — Comparar e listar lacunas

Monte três listas:

**A — Rotas no manifesto (`KNOWN_ROUTES`) mas sem implementação no código real**
Podem ser rotas removidas ou renomeadas que ainda aparecem no manifesto.

**B — Rotas reais que não estão no manifesto (`KNOWN_ROUTES`)**
São rotas novas que precisam ser declaradas no manifesto.

**C — Rotas no manifesto com `covered: false`**
Declaradas mas sem teste implementado.

Se as três listas estiverem vazias, exiba:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ AGENT TESTER — COBERTURA COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Todas as rotas estão cobertas. Nenhuma ação necessária.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

E encerre o skill.

Se houver lacunas, exiba:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  AGENT TESTER — LACUNAS ENCONTRADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  A — Rotas no manifesto sem correspondência no código:
    ⚠️  DELETE /api/collections/:id  (pode ter sido renomeada)

  B — Rotas reais não declaradas no manifesto:
    🆕 GET    /api/collections/stats
    🆕 POST   /api/collections/import

  C — Rotas declaradas com covered: false:
    ❌ POST   /api/scan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Passo 4 — Propor os blocos de teste

Para cada lacuna das listas B e C, proponha:

1. A entrada no `KNOWN_ROUTES` a adicionar ou corrigir (para lista B)
2. A função de teste TypeScript a implementar (para listas B e C)

Siga o padrão já existente no arquivo:
- Funções assíncronas nomeadas `test<NomeDescritivo>()`
- Uso da variável `token` para auth
- Log de resultado com `✅` ou `❌`
- Atualização do `results[]` ao final

Exiba os blocos propostos em code fences TypeScript para revisão do usuário.

Para rotas da lista A, proponha remover ou corrigir a entrada no manifesto e explique o motivo.

Finalize com:

```
Quer que eu aplique essas mudanças no agent-tester.ts?
  → "sim" — aplica e faz /ship
  → "não" — descarta e encerra
```

## Passo 5 — Aplicar e fazer ship (somente se aprovado)

Se o usuário aprovar:

1. Edite `backend/src/scripts/agent-tester.ts`:
   - Adicione as entradas no `KNOWN_ROUTES`
   - Adicione as funções de teste
   - Chame as novas funções dentro do `main()` na sequência correta
   - Remova ou corrija entradas obsoletas da lista A

2. Rode o typecheck para garantir que não há erros:
   ```bash
   cd backend && npm run typecheck
   ```
   Se falhar, corrija antes de prosseguir.

3. Execute `/ship "chore: atualiza agent tester com cobertura das novas rotas"`.

## Notas

- O agent tester usa autenticação via Clerk — novas rotas autenticadas devem usar a variável `token` já disponível no escopo do `main()`
- Rotas de scan (`POST /api/scan`) têm rate limit de 10/min — o teste deve usar uma imagem base64 mínima e válida
- `Card._id` é string (ex: `"base1-4"`), não ObjectId — usar IDs reais ao montar requests de teste
- O manifesto `KNOWN_ROUTES` com `covered: false` quebra o CI com `exit 1` — nunca deixar rota nova com `covered: false` sem implementar o teste no mesmo PR
