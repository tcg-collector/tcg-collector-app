# Sessão: Filtros, Busca e Ordenação na Coleção

**Slug:** filtros-busca-colecao  
**Status:** executing  
**Iniciada:** 2026-06-16  
**Objetivo:** Adicionar busca, chips de condição e ordenação client-side nas telas de coleção e binder, com UX adaptativa para muitos binders e modal reativo com debounce.

## Documentos
- PRD: docs/04 - Produto/PRDs/filtros-busca-colecao.md
- SDD: docs/02 - Backend/SDDs/filtros-busca-colecao.md

## Checkpoints
- [x] PRD criado e aprovado
- [x] SDD criado e aprovado
- [x] Plan Mode executado e aprovado
- [x] Backend implementado (sem mudanças — tudo client-side)
- [x] Frontend implementado
- [x] Testes passando (typecheck + lint — 0 erros)
- [ ] /ship executado com sucesso

## Contexto para próxima sessão
- **Zero mudanças de backend** — todos os dados já chegam populados nas rotas existentes
- **4 componentes novos** em `app/components/`: `SearchBar`, `ConditionChips`, `SortPicker`, `BinderListItem`
- **Colapso de binders:** ≤3 mostra todos; >3 mostra 3 + botão "Ver todos (X)" — estado `bindersExpanded`
- **Slots vazios no binder não filtram fora** — cartas sem `card` populado sempre passam pelo filtro (preserva layout do binder)
- **Reset de página** ao mudar filtro no binder: `setCurrentPage(0)` para evitar página inválida após filtrar
- `useMemo` obrigatório nos itens filtrados de coleção para evitar lentidão com 500+ cartas

## Histórico
- 2026-06-16 — PRD e SDD aprovados, sessão iniciada
