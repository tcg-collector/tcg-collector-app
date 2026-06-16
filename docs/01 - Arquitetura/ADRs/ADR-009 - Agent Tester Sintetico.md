# ADR-009 — Agent Tester Sintético

#arquitetura #decisão #qualidade

**Status**: ✅ Aprovada
**Data**: 2026-06-16

## Contexto

Com o Daily Health Check (ADR-008) já monitorando uptime e testes de unidade/integração, o próximo passo era validar que as rotas da API funcionam corretamente **com autenticação real e dados reais** em produção. O health check não faz chamadas autenticadas — não sabe se o Clerk está funcionando, se os modelos do MongoDB respondem corretamente, ou se a lógica de negócio está intacta.

A necessidade surgiu ao criar o mapa oficial de rotas (16 rotas, 14 fluxos de usuário) e perceber que nenhuma delas era validada sinteticamente após cada deploy.

## Decisão

Criar um **Agent Tester** — script TypeScript que executa chamadas HTTP reais e sequenciais contra a API em produção, simulando um usuário autenticado, e gera um relatório estruturado.

Componentes:
- `backend/src/scripts/agent-tester.ts` — script principal
- `.github/workflows/agent-tester.yml` — GitHub Action com dois triggers:
  - `workflow_run` após CI passar em `main` (E2E pós-merge)
  - `schedule` cron diário às 09:15 BRT
- Três GitHub Secrets: `CLERK_SECRET_KEY`, `CLERK_TEST_USER_ID`, `CLERK_FRONTEND_API_URL`

Autenticação programática (sem login pelo app):
1. `POST https://api.clerk.com/v1/sign_in_tokens` com `user_id` → sign-in token
2. `POST https://<frontend_api>/v1/client/sign_ins` com o ticket → JWT fresco
3. JWT usado em todas as rotas autenticadas no header `Authorization: Bearer`

Estratégia de teste:
1. Testa `/health` sem auth (baseline)
2. Executa rotas em ordem lógica, capturando IDs dinâmicos (cardId, binderId, collectionEntryId)
3. Usa IDs capturados em rotas dependentes (GET por ID, PATCH slots, DELETE)
4. Faz cleanup ao final (DELETE binder e collection entry criados)
5. Relata `pass` / `fail` / `skip` por rota com latência em ms

## Consequências

### Positivas
- Cobre as 16 rotas com chamadas reais autenticadas
- Token JWT gerado programaticamente a cada execução — sem expiração manual
- Captura falhas de integração que testes unitários não pegam (Clerk expirado, MongoDB offline, regras de autorização quebradas)
- Relatório no GitHub Summary com tabela visual por rota
- Nome do run `[Agent Tester] <commit>` facilita rastreabilidade
- Dados de latência permitem identificar degradação de performance ao longo do tempo

### Negativas / trade-offs
- Cria e deleta dados reais no banco de produção → exige conta de teste separada
- `POST /api/scan` testado com imagem sintética 1×1 px → valida que a rota está acessível e autenticada, mas não valida o reconhecimento de cartas
- Roda após o CI (não bloqueia o merge) → falhas de integração são detectadas logo após, não antes

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|----------------------|
| Playwright E2E no frontend | Mais complexo, requer browser headless, não cobre rotas diretamente; reservado para futuro |
| Postman/Newman | Boa opção, mas adiciona dependência externa; o script TypeScript já está no ecossistema do projeto |
| Staging environment | Ideal no futuro, mas complexidade e custo altos para projeto solo em fase inicial |
| Testes de integração no CI | Já existem (ADR-008), mas rodam contra banco in-memory, não contra produção real |
| `CLERK_TEST_TOKEN` estático | Expira periodicamente, exige renovação manual; substituído por geração programática via Backend API |

---
*Veja também: [[ADR-008 - Estrategia de Qualidade e Estabilidade]], [[Mapa de Rotas e Fluxos]], [[Agent Tester]]*
