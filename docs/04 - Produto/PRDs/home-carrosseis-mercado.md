# PRD — Home: Carrosséis de Mercado

**Status:** Draft  
**Data:** 2026-06-16  
**Fase do produto:** Fase 2

---

## Problema

A tela Home hoje é estática: mostra apenas uma saudação e acesso rápido à coleção. O colecionador não tem nenhum estímulo visual de mercado ao abrir o app — não sabe quais cartas estão valorizando nem quais são as mais valiosas do catálogo neste momento. O sino de notificação ocupa espaço no header sem funcionalidade ativa.

## Solução

Redesign da Home com dois carrosséis de inteligência de mercado:

- **"Maiores Valorizações"** — top cartas do catálogo global por % de crescimento nos últimos 7 dias, consumindo `GET /api/prices/top-gainers?days=7&limit=10`. Cada card exibe: imagem da carta, nome, preço atual em BRL e badge de variação percentual (ex: +34%).
- **"Mais Valiosas"** — top cartas do catálogo global por valor absoluto atual, consumindo `GET /api/prices/top-value?limit=10`. Cada card exibe: imagem da carta, nome e preço atual em BRL.
- Remoção do sino de notificação do header.
- Estado vazio exibido nos primeiros dias após deploy (antes do banco acumular snapshots históricos): mensagem neutra "Dados de mercado em breve".

## Usuário-alvo

Todo colecionador autenticado que abre o app — do iniciante que quer saber "o que está em alta?" ao avançado que monitora o mercado para comprar e vender no momento certo.

## Critérios de aceite

- [ ] Sino de notificação removido do header da Home
- [ ] Carrossel "Maiores Valorizações" exibe até 10 cartas ordenadas por % desc
- [ ] Cada card do carrossel de valorizações mostra: imagem, nome, preço em BRL e badge `+X%` em verde
- [ ] Carrossel "Mais Valiosas" exibe até 10 cartas ordenadas por valor desc
- [ ] Cada card do carrossel de valor mostra: imagem, nome e preço em BRL
- [ ] Estado vazio exibe mensagem neutra quando os endpoints retornam lista vazia
- [ ] Loading skeleton durante o fetch (não tela em branco)
- [ ] Toque em qualquer card navega para `app/card/[id]`
- [ ] Ambos os carrosséis são horizontais (scroll lateral)
- [ ] Preço exibido em BRL usando a cotação do endpoint `/api/prices/exchange`

## Fora do escopo

- Filtro de período nos carrosséis (sempre D-7 e valor atual)
- Carrosséis de coleção do usuário (vem na feature [3])
- Notificações de preço (Fase 3)
- Personalização da Home
- Pull-to-refresh manual (dados atualizam no mount)

## Impacto esperado

A Home passa de uma tela de navegação passiva para um painel de mercado vivo. O usuário tem razão para abrir o app todos os dias — não apenas para gerenciar binders, mas para acompanhar o que está movimentando o mercado Pokémon TCG.

## Dependências

- Feature "Histórico de Preços" (entregue) — endpoints `/api/prices/top-gainers` e `/api/prices/top-value` já existem em produção
- Cotação USD→BRL via `/api/prices/exchange` (já existe)
