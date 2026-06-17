# PRODUTEIRO-2026-W25 — 2026-06-17

## Contexto SWOT consumido
Relatório: SWOT-2026-W25 — 2026-06-17
Top gaps da semana:
- Card Dex Oficial descontinuado — 3.067 reviews órfãos buscando alternativa
- Dex TCG removeu scanner — maior app multi-TCG sem scan agora
- Pokéllector em colapso de estabilidade — app mais popular entre BR se deteriorando

## Oportunidades priorizadas

| # | Oportunidade | Origem | Impact | Confidence | Effort | ICE |
|----|--------------|--------|--------|------------|--------|-----|
| 1 | Gráfico histórico de preço na tela de carta | Backend pronto; Collectr, Dex, PokéCardex e MonPrice têm e é muito elogiado | 7 | 10 | 2 | 35.0 |
| 2 | Campanha de captação — ex-usuários Card Dex + Pokéllector | Card Dex morto (3k reviews); Pokéllector em colapso com crashes + ads | 8 | 8 | 2 | 32.0 |
| 3 | Sentry — monitoramento de erros | Plano já documentado; pré-requisito de qualidade antes de escalar usuários | 5 | 10 | 2 | 25.0 |
| 4 | Wishlist + alertas de preço em BRL | Único nicho livre confirmado; apenas MonPrice tem alertas, sem foco BR | 8 | 9 | 6 | 12.0 |
| 5 | EAS Build + App Store + Play Store | Sem loja = invisível para usuários órfãos; janela de captação aberta agora | 9 | 9 | 7 | 11.6 |
| 6 | UX/UI auditoria e ciclo de melhorias | PokéCardex 4.5/5 com UI polida; Pokéllector em colapso parcialmente por UX ruim | 7 | 6 | 4 | 10.5 |
| 7 | POC cartas japonesas (variantes/idiomas) | PokéCardex muito elogiado por suporte JP; nenhum app BR tem | 6 | 7 | 5 | 8.4 |
| 8 | Offline-first | PokéCardex elogiado; mas mudança de arquitetura pesada para pequena base atual | 7 | 5 | 9 | 3.9 |

## Alertas de urgência

⚠️ **EAS Build tem urgência fora do ICE:** apesar do ICE médio (11.6), há janela temporal crítica — usuários órfãos do Card Dex estão migrando AGORA. Sem estar nas lojas, somos invisíveis para eles. A campanha de captação (ICE 32.0) depende do EAS Build para alcançar novos usuários via App Store/Play Store. Considerar antecipar EAS Build para viabilizar a campanha.

## Itens do backlog a reconsiderar

- **Wishlist + alertas de preço** está em Fase 3 no backlog atual. ICE 12.0 com mercado confirmado sugere antecipar para Fase 2.
- **EAS Build** está em Fase 3. A oportunidade de captação Card Dex sugere antecipar para Fase 2, preferencialmente antes da campanha.
- **Offline-first** não está no backlog. ICE 3.9 — não priorizar agora, mas incluir no radar de Fase 3.
- Todos os demais itens do backlog continuam válidos e com priorização confirmada pelo mercado.

## Para o Agent Planner — top 3 desta semana

1. **Gráfico histórico de preço** (ICE 35.0) — backend pronto, só falta frontend; menor esforço, maior retorno imediato
2. **Sentry** (ICE 25.0) — plano documentado em `docs/05 - Qualidade/Sentry-Plan.md`; pré-requisito antes de crescer base
3. **Campanha de captação Card Dex + Pokéllector** (ICE 32.0) — janela de oportunidade aberta agora; requer EAS Build como pré-requisito para alcançar usuários nas lojas

## Comparação com semana anterior

Primeira execução — sem dados anteriores para comparar.
