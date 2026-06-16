# 📋 ADRs — Architecture Decision Records

#arquitetura #decisão

Registro de todas as decisões de arquitetura importantes do projeto. Cada ADR documenta **o quê**, **por quê** e **quais alternativas foram descartadas**.

## Índice

| # | Decisão | Status |
|---|---------|--------|
| [[ADR-001 - React Native + Expo]] | Framework mobile | ✅ Aprovada |
| [[ADR-002 - MongoDB Atlas]] | Banco de dados | ✅ Aprovada |
| [[ADR-003 - Expo EAS sem nativo local]] | Build sem Mac/Android Studio | ✅ Aprovada |
| [[ADR-004 - TypeScript strict]] | Linguagem tipada no backend | ✅ Aprovada |
| [[ADR-005 - expo-router]] | Roteamento file-based | ✅ Aprovada |
| [[ADR-006 - Clerk Production Instance]] | Instância Clerk Production correta em prod | ✅ Aprovada |
| [[ADR-007 - Sync de Cartas PokéTCG]] | Estratégia de sync do catálogo de cartas | ✅ Aprovada |
| [[ADR-008 - Estrategia de Qualidade e Estabilidade]] | Testes, CI/CD, rate limiting, CORS, validação | ✅ Aprovada |
| [[ADR-009 - Agent Tester Sintetico]] | Monitoramento sintético E2E das 16 rotas em produção | ✅ Aprovada |

## Template para novos ADRs

```markdown
# ADR-NNN - Título

**Status**: Proposta | Aprovada | Descartada | Substituída por ADR-XXX
**Data**: YYYY-MM-DD

## Contexto
O que motivou essa decisão?

## Decisão
O que foi decidido?

## Consequências
### Positivas
### Negativas / trade-offs

## Alternativas consideradas
| Opção | Por que foi descartada |
```
