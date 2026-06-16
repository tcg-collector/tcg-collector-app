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
- `.github/workflows/agent-tester.yml` — GitHub Action cron diário (09:15 BRT)
- `CLERK_TEST_TOKEN` — GitHub Secret com JWT de conta de teste dedicada

Estratégia de teste:
1. Testa `/health` sem auth (baseline)
2. Executa rotas em ordem lógica, capturando IDs dinâmicos (cardId, binderId, collectionEntryId)
3. Usa IDs capturados em rotas dependentes (GET por ID, PATCH slots, DELETE)
4. Faz cleanup ao final (DELETE binder e collection entry criados)
5. Relata `pass` / `fail` / `skip` por rota com latência em ms

## Consequências

### Positivas
- Cobre as 16 rotas com chamadas reais autenticadas
- Captura falhas de integração que testes unitários não pegam (ex: Clerk expirado, MongoDB offline, regras de autorização quebradas)
- Relatório no GitHub Summary com tabela visual por rota
- Dados de latência permitem identificar degradação de performance ao longo do tempo

### Negativas / trade-offs
- Cria e deleta dados reais no banco de produção → exige conta de teste separada
- `POST /api/scan` testado com imagem sintética 1×1 px → valida que a rota está acessível e autenticada, mas não valida o reconhecimento de cartas
- Token Clerk (`CLERK_TEST_TOKEN`) expira periodicamente → manutenção manual necessária
- Roda após o deploy (não bloqueia o deploy) → falhas são detectadas depois, não antes

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|----------------------|
| Playwright E2E no frontend | Mais complexo, requer browser headless, não cobre rotas diretamente; reservado para futuro |
| Postman/Newman | Boa opção, mas adiciona dependência externa; o script TypeScript já está no ecossistema do projeto |
| Staging environment | Ideal no futuro, mas complexidade e custo altos para projeto solo em fase inicial |
| Testes de integração no CI | Já existem (ADR-008), mas rodam contra banco in-memory, não contra produção real |

---
*Veja também: [[ADR-008 - Estrategia de Qualidade e Estabilidade]], [[Mapa de Rotas e Fluxos]], [[Agent Tester]]*
