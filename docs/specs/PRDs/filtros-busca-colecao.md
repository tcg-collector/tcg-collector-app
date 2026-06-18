# PRD — Filtros, Busca e Ordenação na Coleção

**Status:** Draft  
**Data:** 2026-06-16  
**Fase do produto:** Fase 3

---

## Problema

O colecionador com 50+ cartas na coleção avulsa hoje não tem como encontrar uma carta específica, ver só as NM, ou ordenar por valor. Tudo aparece em um grid fixo sem controle. O mesmo vale para binders — não há busca nem ordenação. O modal de adicionar carta exige clicar em "Buscar" a cada consulta, tornando o fluxo lento.

## Solução

Adicionar uma camada de filtros e ordenação client-side nas telas de coleção e binders, e tornar o modal de busca reativo. Nenhuma nova chamada de API para filtros de condição e ordenação — os dados já estão carregados.

**Coleção avulsa:**
- Busca inline por nome (filtra o grid em tempo real)
- Chips de condição: Todos · NM · LP · MP · HP · DMG
- Ordenação: Valor ↓ · Valor ↑ · Nome A-Z · Adicionado recentemente
- Contador dinâmico: "24 de 87 cartas"

**Binders — tela de coleção:**
- Busca inline por nome do binder
- Toggle de layout: Grid (atual) / Lista (novo — mostra barra de progresso e valor)
- Ordenação: Mais recente · Nome A-Z · Mais completo
- UX adaptativa: com até 3 binders, exibe todos no scroll horizontal atual; com 4+ binders, mostra os 3 mais recentes e colapsa o restante atrás de um botão "Ver todos (X)"

**Dentro do binder (tela de detalhe):**
- Busca inline por nome da carta (filtra os slots em tempo real)
- Chips de condição: Todos · NM · LP · MP · HP · DMG

**Modal de adicionar carta:**
- Busca reativa com debounce de 400ms (sem botão "Buscar")
- Chips de filtro: Edição · Raridade · Tipo
- Preço BRL já visível na lista de resultados
- Ordenação dos resultados: Relevância · Preço ↓ · Nome

## Usuário-alvo

Todo colecionador com coleção crescente — especialmente quem tem 30+ cartas e perde tempo rolando o grid para achar o que quer.

## Critérios de aceite

- [ ] Campo de busca filtra cartas da coleção avulsa em tempo real (sem chamada à API)
- [ ] Chips de condição filtram corretamente e acumulam com a busca por nome
- [ ] Ordenação por valor usa preço × multiplicador de condição
- [ ] Contador "X de Y cartas" atualiza ao filtrar
- [ ] Binders têm toggle Grid/Lista funcionando em mobile e web
- [ ] Vista Lista dos binders mostra nome, progresso (X/Y slots) e valor total estimado
- [ ] Com 4+ binders, seção mostra 3 e colapsa o restante; botão "Ver todos (X)" expande
- [ ] Dentro do binder, busca por nome e chips de condição filtram os slots
- [ ] Modal de busca dispara automaticamente após 400ms sem digitar (debounce)
- [ ] Preço BRL aparece nos resultados do modal
- [ ] Filtros de condição resetam ao fechar e reabrir a tela (não persistem)
- [ ] Nenhuma regressão nos fluxos existentes (adicionar carta, abrir binder, scan)

## Fora do escopo

- Filtros salvos/persistidos entre sessões
- Filtros server-side na API `/api/collections` (fica para quando a coleção ultrapassar 500 cartas)
- Ordenação dentro dos slots do binder
- Filtro por faixa de preço (slider)
- Busca por número da carta

## Impacto esperado

O colecionador encontra qualquer carta em segundos em vez de rolar o grid inteiro. A vista Lista dos binders permite comparar rapidamente qual binder tem mais valor ou mais cartas. O modal de busca passa de "processo manual" para "busca fluida".

## Dependências

Nenhuma — todos os dados necessários já estão disponíveis no frontend.
