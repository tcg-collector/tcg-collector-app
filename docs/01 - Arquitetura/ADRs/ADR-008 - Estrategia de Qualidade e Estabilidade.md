# ADR-008 — Estratégia de Qualidade e Estabilidade (Junho 2026)

#arquitetura #decisão #qualidade #testes

**Status**: ✅ Aprovada
**Data**: 2026-06-15

## Contexto

Um bug em produção onde `cardId` inválido era salvo no binder sem erro motivou uma revisão completa da qualidade do código. O produto ainda não tinha testes, CI/CD, validação de input centralizada, nem proteção contra abuso de API.

## Decisão

Implementar uma base de qualidade antes de adicionar novas features, cobrindo:

1. **Validação centralizada** — `backend/src/validation/schemas.ts` com funções puras para todos os inputs de binders, collections e slots. Sem Zod (zero dependência extra).
2. **Testes unitários** — 26 testes cobrindo validação, formatação de preço e multiplicadores de condição.
3. **Testes de integração com banco real** — `mongodb-memory-server` para testar rotas com MongoDB real em memória. Inclui teste de regressão explícito para o bug do binder.
4. **CI/CD no GitHub Actions** — pipeline em `develop` e `main` com typecheck + ESLint + testes em cada PR.
5. **Rate limiting** — middleware customizado sem dependência externa; 10 req/min por usuário no `/api/scan` (protege custo Anthropic API). Chave = `userId` autenticado, fallback para IP.
6. **CORS sem IPs hardcoded** — IPs de desenvolvimento saem do código e entram em `CORS_EXTRA_ORIGINS` no `.env`.
7. **Error handler global** — `errorHandler` middleware registrado como último middleware em `index.ts`.
8. **Retry logic no sync** — `syncPricesOnly` e `syncAllCards` com 3 tentativas e 5s de espera entre elas.

## Consequências

### Positivas
- Bugs de input são pegos na validação antes de chegar ao banco
- Regressões são detectadas automaticamente no CI antes do merge
- Custo da Anthropic API está protegido contra uso abusivo
- Nenhum IP pessoal de desenvolvimento exposto no código

### Negativas / trade-offs
- CI adiciona ~1-2 min por PR
- `mongodb-memory-server` adiciona ~34 pacotes ao devDependencies

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|------------------------|
| Zod para validação | Dependência extra desnecessária para validações simples |
| express-rate-limit | Dependência externa; implementação customizada é suficiente e sem overhead |
| Testes apenas unitários | Não teria pegado o bug original (que era comportamento de rota + banco) |

---
*Veja também: [[ADR-004 - TypeScript strict]], [[ADR-007 - Sync de Cartas PokéTCG]]*
