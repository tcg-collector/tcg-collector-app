# sprint-2026-W25 — proposta gerada em 2026-06-19

**Status:** ⏳ Aguardando aprovação
**Fontes:** PRODUTEIRO-2026-W25 (2026-06-17) + Tester 21/21 rotas ok (run #27790644776)
**Estimativa:** ~3h

> Para aprovar: mude "Status" acima para "Aprovada" e chame @agent-builder
> Para ajustar: edite os itens abaixo antes de aprovar
> Para cancelar: delete este arquivo

---

## Itens — ordem de execução

### 1. Gráfico histórico de preço — tela de carta (frontend)
- **Origem:** B-001 | ICE 24.0 (Produteiro W25 #1) | Effort 3
- **Escopo:** Implementar componente de gráfico de preço histórico na tela de detalhe de carta no frontend. Backend já entrega os dados (histórico de preços sincronizado diariamente às 03h BRT). PRD em `docs/specs/PRDs/historico-precos.md`. Somente trabalho de frontend — consumir endpoint existente e renderizar gráfico com dados em BRL.
- **Critério de pronto:** Tela de detalhe de carta exibe gráfico de linha com histórico de preço em BRL. Funciona em web (Vercel) e mobile (Expo). Sem regressão nas rotas do Tester.
- **Backlog ID:** B-001
- **Status:** ⏳ Pendente

---

## Candidato reserva

- Campanha de captação — ex-usuários Card Dex + Pokéllector — Esforço: ~2h | ICE: 32.0 | Sem Backlog ID (hipótese sem ID — depende de EAS Build como pré-requisito)

---

## Fora do sprint

- **Sentry** (B-002 / ICE 22.5) — adiado: Railway CLI + Vercel CLI instalados cobrem necessidade de debug imediata. Sentry entra quando base de usuários crescer.
- **EAS Build + App Store + Play Store** (H-003 / ICE 11.6) — Effort 7; semana dedicada.
- **Wishlist + alertas de preço** (H-004 / ICE 12.0) — hipótese sem PRD.
- **UX/UI auditoria** (H-005 / ICE 10.5) — hipótese; sem escopo.
- **POC cartas japonesas** (H-006 / ICE 8.4) — requer POC técnica.

---

## Notas para o Builder

- **Gráfico histórico:** backend já entrega dados. Consultar `docs/specs/PRDs/historico-precos.md` antes de iniciar para entender o contrato de API.
- **Sem bugs ativos:** Tester confirmou 21/21 rotas ok. Nenhum BUG-xxx no backlog.
- **Risco esperado:** Baixo — novo componente frontend, sem alteração em rotas ou modelos.
