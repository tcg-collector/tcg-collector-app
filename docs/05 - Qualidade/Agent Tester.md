# Agent Tester — TCG Bindex

> Primeiro agente automatizado do projeto. Testa todas as 16 rotas da API de forma sintética, rodando como GitHub Action após cada CI aprovado em main e diariamente às 09:15 BRT.

---

## O que é

O Agent Tester é um script TypeScript (`backend/src/scripts/agent-tester.ts`) que executa uma sequência de chamadas HTTP reais contra a API em produção, simulando o comportamento de um usuário autenticado. Gera um relatório estruturado no GitHub Summary após cada execução.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `backend/src/scripts/agent-tester.ts` | Script principal de testes sintéticos |
| `.github/workflows/agent-tester.yml` | GitHub Action — roda após CI + cron diário |

## Configuração obrigatória

O repositório precisa de três GitHub Secrets:

```
CLERK_SECRET_KEY       →  Clerk Backend API secret key (instância Production)
CLERK_TEST_USER_ID     →  User ID do usuário de teste no Clerk (ex: user_xxx)
CLERK_FRONTEND_API_URL →  Frontend API URL do Clerk (ex: clerk.tcgbindex.app)
```

O script gera um token JWT fresco a cada execução via Clerk Backend API — sem expiração manual, sem login pelo app.

### Como funciona a autenticação

1. Chama `POST https://api.clerk.com/v1/sign_in_tokens` com o `user_id` e `CLERK_SECRET_KEY` → obtém sign-in token
2. Troca o sign-in token por JWT via `POST https://<CLERK_FRONTEND_API_URL>/v1/client/sign_ins`
3. Usa o JWT em todas as rotas autenticadas via `Authorization: Bearer <jwt>`

## Sequência de testes

O script testa as rotas em ordem lógica, capturando IDs dinâmicos para testes dependentes:

1. **GET /health** — público, sem auth
2. **GET /api/sets** — lista sets disponíveis
3. **GET /api/cards?name=Pikachu** — busca carta (captura firstCardId)
4. **GET /api/cards/:id** — detalhe da carta (usa firstCardId)
5. **GET /api/collections** — lista coleção
6. **GET /api/prices/exchange** — cotação USD→BRL
7. **GET /api/prices/:cardId** — preço de carta específica
8. **GET /api/binders** — lista binders
9. **POST /api/binders** — cria binder de teste (captura createdBinderId)
10. **GET /api/binders/:id** — abre binder criado
11. **POST /api/binders/:id/pages** — adiciona página
12. **PATCH /api/binders/:id/slots/0** — coloca carta em slot
13. **POST /api/collections** — adiciona carta à coleção (captura entryId)
14. **POST /api/scan** — verifica rota acessível (payload sintético → espera 400/422/200, timeout 45s)
15. **DELETE /api/collections/:id** — cleanup
16. **DELETE /api/binders/:id** — cleanup

## Triggers

| Trigger | Quando roda |
|---------|-------------|
| `workflow_run` (CI success) | Após cada push em `main` que passar no CI |
| `schedule` cron | Todo dia às **09:15 BRT** (12:15 UTC) |
| `workflow_dispatch` | Manualmente: **Actions → Agent Tester → Run workflow** |

O nome do run aparece como `[Agent Tester] <mensagem do último commit>`.

## Relatório

O GitHub Summary mostra uma tabela com status, HTTP status e latência de cada rota. Rotas com `skip` (token ausente, ID não capturado) não contam como falha. Apenas `fail` causa o workflow a falhar e gera notificação.

## Limitações conhecidas

- **POST /api/scan**: testado com imagem 1×1 px sintética — confirma que a rota está ativa e autenticada, mas não valida a lógica de reconhecimento. Timeout de 45s (chama API externa de visão).
- **Rate limit**: a rota `/api/scan` tem limite de 10/min — o script envia apenas 1 requisição por execução
- **Dados reais**: o script cria e deleta dados reais no banco de produção da conta de teste. Usar conta separada é obrigatório.

---

*Relacionado: [[Mapa de Rotas e Fluxos]], [[ADR-008 - Estrategia de Qualidade e Estabilidade]], [[ADR-009 - Agent Tester Sintetico]]*
