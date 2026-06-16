# Agent Tester — TCG Bindex

> Primeiro agente automatizado do projeto. Testa todas as 16 rotas da API de forma sintética, rodando como GitHub Action diariamente.

---

## O que é

O Agent Tester é um script TypeScript (`backend/src/scripts/agent-tester.ts`) que executa uma sequência de chamadas HTTP reais contra a API em produção, simulando o comportamento de um usuário autenticado. Gera um relatório estruturado no GitHub Summary após cada execução.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `backend/src/scripts/agent-tester.ts` | Script principal de testes sintéticos |
| `.github/workflows/agent-tester.yml` | GitHub Action que roda o script diariamente |

## Configuração obrigatória

Antes de usar, o repositório precisa de um GitHub Secret:

```
CLERK_TEST_TOKEN  →  JWT de longa duração de uma conta de teste no Clerk
```

### Como criar o token de teste

1. Acesse https://clerk.com → seu projeto → **Users**
2. Crie um usuário de teste: `agent-tester@tcgbindex.app`
3. Em **Sessions**, gere uma session token de longa duração (ou use a API do Clerk para emitir um JWT com expiração longa)
4. Adicione ao GitHub: **Settings → Secrets → Actions → New secret** → nome `CLERK_TEST_TOKEN`

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
14. **POST /api/scan** — verifica rota acessível (payload sintético → espera 400/422)
15. **DELETE /api/collections/:id** — cleanup
16. **DELETE /api/binders/:id** — cleanup

## Schedule

Roda todo dia às **09:15 BRT** (12:15 UTC) — 15 minutos depois do Daily Health Check.

Também pode ser disparado manualmente: **Actions → Agent Tester → Run workflow**

## Relatório

O GitHub Summary mostra uma tabela com status, HTTP status e latência de cada rota. Rotas com `skip` (token ausente, ID não capturado) não contam como falha. Apenas `fail` causa o workflow a falhar e gera notificação.

## Limitações conhecidas

- **POST /api/scan**: testado com imagem 1×1 px sintética — confirma que a rota está ativa e autenticada, mas não valida a lógica de reconhecimento
- **Rate limit**: a rota `/api/scan` tem limite de 10/min — o script envia apenas 1 requisição por execução
- **Dados reais**: o script cria e deleta dados reais no banco de produção da conta de teste. Usar conta separada é obrigatório.

---

*Relacionado: [[Mapa de Rotas e Fluxos]], [[ADR-008 - Estrategia de Qualidade e Estabilidade]]*
