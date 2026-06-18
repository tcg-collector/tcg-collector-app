# SDD — Filtros, Busca e Ordenação na Coleção

**PRD:** [[../PRDs/filtros-busca-colecao]]  
**Status:** Draft  
**Data:** 2026-06-16

---

## Visão técnica

Camada de filtros e ordenação 100% client-side nas telas de coleção e binder — nenhum endpoint novo ou modificado, apenas estado local e lógica de filtragem nos componentes existentes.

---

## Backend

### Endpoints novos ou modificados

Nenhum. Todos os dados já chegam completos ao frontend:
- `GET /api/collections` → retorna toda a coleção com `cardId` populado
- `GET /api/binders` → retorna todos os binders com slots populados (campo `card` em cada slot)

### Modelo de dados

Sem alterações de schema. Campos relevantes já disponíveis:

**Para filtros de condição:** `items[].condition` (`NM|LP|MP|HP|DMG`)  
**Para ordenação por valor:** `items[].cardId.prices` × multiplicadores de condição  
**Para ordenação por nome:** `items[].cardId.name`  
**Para slots de binder:** `binder.slots[].condition`, `binder.slots[].card.name`, `binder.slots[].card.prices`

---

## Frontend

### Telas afetadas

- `app/app/(tabs)/collection.tsx` — busca + condição + ordenação na lista avulsa; colapso adaptativo dos binders; toggle grid/lista nos binders
- `app/app/binder/[id].tsx` — busca por nome + chips de condição filtrando os slots exibidos

### Novos componentes

Criar em `app/components/`:

- **`SearchBar.tsx`** — input de texto com ícone lupa, `onChangeText`, placeholder customizável. Usado na collection e no binder.
- **`ConditionChips.tsx`** — row de chips: `Todos | NM | LP | MP | HP | DMG`. Recebe `selected` e `onSelect`. Usado na collection e no binder.
- **`SortPicker.tsx`** — row horizontal de chips de ordenação. Recebe `options: {label, value}[]`, `selected`, `onSelect`. Usado só na collection avulsa.
- **`BinderListItem.tsx`** — item de binder para o layout Lista: nome, gridConfig, progresso (X/Y slots preenchidos), valor total estimado em BRL. Reutilizado na collection.

### Estados e fluxo de dados

#### `collection.tsx` — avulso

```
useCollection() → items[]
        ↓
filteredItems = items
  .filter(i => i.cardId.name.toLowerCase().includes(searchQuery))
  .filter(i => conditionFilter === 'ALL' || i.condition === conditionFilter)
  .sort(by sortMode)
        ↓
Renderiza filteredItems no grid
Contador: "X de Y cartas"
```

Multiplicadores de condição para sort por valor:
```ts
const MULTIPLIERS = { NM: 1, LP: 0.8, MP: 0.6, HP: 0.4, DMG: 0.2 }
const cardValue = (item) =>
  (item.cardId.prices?.normal?.market ?? item.cardId.prices?.holofoil?.market ?? 0)
  * MULTIPLIERS[item.condition]
```

**Sort modes:** `VALUE_DESC | VALUE_ASC | NAME_ASC | ADDED_DESC`

#### `collection.tsx` — binders adaptativos

```
useBinders() → binders[]  (sorted by createdAt: -1, já vem do backend)
        ↓
binderQuery (search state)
        ↓
filteredBinders = binders.filter(b => b.name.toLowerCase().includes(binderQuery))
        ↓
if filteredBinders.length <= 3 → mostra todos no layout atual
if filteredBinders.length > 3 && !expanded → mostra os 3 primeiros + botão "Ver todos (X)"
if filteredBinders.length > 3 && expanded → mostra todos
```

Toggle **Grid / Lista** altera `binderLayout: 'grid' | 'list'` — no modo Lista, usa `BinderListItem.tsx`.

Valor total estimado de um binder:
```ts
const binderValue = (binder) =>
  binder.slots
    .filter(s => s.card)
    .reduce((sum, s) =>
      sum + (s.card.prices?.normal?.market ?? s.card.prices?.holofoil?.market ?? 0)
      * MULTIPLIERS[s.condition], 0)
```

#### `binder/[id].tsx` — slots

```
useBinder(id) → binder.slots[]
        ↓
filteredSlots = binder.slots
  .filter(s => !s.card || s.card.name.toLowerCase().includes(slotSearch))
  .filter(s => !s.card || slotCondition === 'ALL' || s.condition === slotCondition)
        ↓
Paginar filteredSlots por (cols × rows) para montar as páginas
```

> **Detalhe:** slots vazios (`!s.card`) passam sempre pelo filtro — mostrar o slot vazio na posição correta é importante para a navegação visual do binder.

#### Modal de adicionar carta (ambas as telas)

Busca reativa com debounce de 400ms:
```ts
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery.length >= 2) fetchCards()
  }, 400)
  return () => clearTimeout(timer)
}, [searchQuery, selectedSet])
```

Exibir `prices.normal.market` ou `prices.holofoil.market` em BRL (× `rate`) na lista de resultados.

---

## Novos estados locais

### `collection.tsx`

```ts
const [looseSearch, setLooseSearch] = useState('')
const [looseCondition, setLooseCondition] = useState<'ALL'|Condition>('ALL')
const [looseSort, setLooseSort] = useState<'VALUE_DESC'|'VALUE_ASC'|'NAME_ASC'|'ADDED_DESC'>('ADDED_DESC')
const [binderSearch, setBinderSearch] = useState('')
const [bindersExpanded, setBindersExpanded] = useState(false)
const [binderLayout, setBinderLayout] = useState<'grid'|'list'>('grid')
```

### `binder/[id].tsx`

```ts
const [slotSearch, setSlotSearch] = useState('')
const [slotCondition, setSlotCondition] = useState<'ALL'|Condition>('ALL')
```

---

## Testes a escrever

Backend: nenhum — sem mudança de rotas.

Frontend (unitários):
- [ ] Filtragem por condição retorna só os itens corretos
- [ ] Filtragem por nome é case-insensitive
- [ ] Sort por valor usa multiplicador de condição corretamente
- [ ] Colapso de binders: ≤3 → todos visíveis; >3 → 3 + botão
- [ ] Slots vazios não são filtrados fora ao buscar por nome
- [ ] Debounce no modal não dispara antes de 400ms

---

## Arquivos a tocar

```
app/
  app/(tabs)/collection.tsx          ← adicionar estados + lógica de filtro + componentes
  app/binder/[id].tsx                ← adicionar estados + filtrar slots + componentes
  components/SearchBar.tsx           ← novo
  components/ConditionChips.tsx      ← novo
  components/SortPicker.tsx          ← novo
  components/BinderListItem.tsx      ← novo
```

Sem mudanças em backend, models, testes de integração ou API Reference.

---

## Riscos e trade-offs

- **Performance:** `items.filter().sort()` a cada render pode ser lento com 500+ cartas. Mitigação: `useMemo` nos itens filtrados, dependendo de `[items, looseSearch, looseCondition, looseSort]`.
- **Paginação do binder com filtro:** filtrar slots antes de paginar muda o número de páginas dinamicamente — o `scrollRef` pode ficar em página inválida. Mitigação: resetar `currentPage` para 0 ao mudar filtro.
- **looseOnly dead code:** `const looseOnly = items.filter(_i => true)` em `collection.tsx` pode ser removido e substituído pela lógica de filtro real.
- **Estimativa de valor do binder:** sem preço histórico, usa `market` price atual. Se carta não tem preço, contribui com R$ 0 (sem crash).

