---
name: feature
description: >
  Orquestra o desenvolvimento completo de uma feature: valida contexto, gera PRD,
  gera SDD e prepara para Plan Mode. Use sempre que o usuário quiser implementar
  algo novo, adicionar funcionalidade, criar uma tela, endpoint ou fluxo novo.
---

# Feature — OS de Desenvolvimento TCG Bindex

Fluxo completo: contexto → PRD → SDD → Mockup (se UI) → Plan Mode.

## Argumento esperado

```
/feature "descrição da feature"
```

---

## Etapa 1 — Validação de contexto

Antes de gerar qualquer documento, avalie se o argumento tem informação suficiente para responder:

1. **O quê:** o que será construído (tela, endpoint, fluxo)?
2. **Por quê:** qual problema resolve para o colecionador?
3. **Quem:** qual perfil de usuário é impactado?
4. **Critério de aceite:** como saberemos que está pronto?
5. **Escopo:** o que está **fora** desta feature?

Se qualquer um desses pontos estiver vago ou ausente, **pare e pergunte** antes de prosseguir. Seja específico sobre o que falta — não faça perguntas genéricas. Exemplo:

> Preciso de mais contexto antes de montar o PRD. Me responde:
> - Quando o usuário filtra por condição "NM", ele vê só as cartas NM ou também as melhores que NM?
> - O filtro deve persistir entre sessões ou resetar ao sair da tela?

Só avance para a Etapa 2 quando tiver clareza suficiente sobre os 5 pontos acima.

---

## Etapa 2 — PRD (Product Requirements Document)

Gere o PRD e **salve em `docs/04 - Produto/PRDs/<slug-da-feature>.md`**.

Use este template:

```markdown
# PRD — <Nome da Feature>

**Status:** Draft  
**Data:** <data atual>  
**Fase do produto:** <Fase 2 / Fase 3 / etc>

---

## Problema
<Qual dor do colecionador esta feature resolve? Por quê agora?>

## Solução
<Descrição clara do que será construído em linguagem de produto, não técnica>

## Usuário-alvo
<Perfil específico: colecionador iniciante / avançado / vendedor?>

## Critérios de aceite
- [ ] <critério mensurável e testável>
- [ ] <critério mensurável e testável>
- [ ] <critério mensurável e testável>

## Fora do escopo
- <o que explicitamente não será feito nesta entrega>

## Impacto esperado
<O que muda na experiência do usuário após esta feature?>

## Dependências
<Features ou infra que precisam existir antes>
```

Após salvar, exiba o PRD completo e pergunte:

> PRD salvo em `docs/04 - Produto/PRDs/<slug>.md`. Está alinhado com o que você quer? Posso ajustar antes de gerar o SDD.

Só avance para a Etapa 3 após confirmação explícita.

---

## Etapa 3 — SDD (Software Design Document)

Com o PRD aprovado, use **dois subagentes em paralelo** para pesquisar o código atual antes de escrever o SDD:

**Subagente A — Backend:** leia rotas em `backend/src/routes/`, models em `backend/src/models/`, middleware relevante em `backend/src/middleware/`

**Subagente B — Frontend:** leia a tela relacionada em `app/app/`, componentes relevantes em `app/components/`

Aguarde os dois retornarem, consolide os achados e só então escreva o SDD. Isso garante que o design técnico reflete o código real, não suposições.

Gere o SDD e **salve em `docs/02 - Backend/SDDs/<slug-da-feature>.md`**.

Use este template:

```markdown
# SDD — <Nome da Feature>

**PRD:** [[PRDs/<slug-da-feature>]]  
**Status:** Draft  
**Data:** <data atual>

---

## Visão técnica
<Resumo de uma linha: o que muda no sistema>

## Backend

### Endpoints novos ou modificados
| Método | Rota | Auth | Mudança |
|--------|------|------|---------|
| <método> | <rota> | ✅/❌ | <o que muda> |

### Parâmetros / Body
<Descrever query params, body schema ou response changes com exemplos JSON>

### Modelo de dados
<Campos novos, índices novos, ou migrations necessárias>

### Validações e regras de negócio
- <regra específica>

## Frontend

### Telas afetadas
- `app/app/<caminho>` — <o que muda>

### Novos componentes
- `<ComponentName>` — <responsabilidade>

### Estados e fluxo de dados
<Como os dados fluem da API para a UI>

## Testes a escrever
- [ ] <teste de integração backend>
- [ ] <teste unitário frontend>

## Arquivos a tocar
- `backend/src/routes/<arquivo>.ts`
- `app/app/<tela>.tsx`
- `docs/02 - Backend/API Reference.md` ← atualizar se rota mudar

## Riscos e trade-offs
- <risco técnico ou de UX identificado>
```

Após salvar o SDD, crie o **artifact de sessão** em `.claude/sessions/<slug>.md`:

```markdown
# Sessão: <Nome da Feature>

**Slug:** <slug>
**Status:** executing
**Iniciada:** <data atual>
**Objetivo:** <objetivo em uma linha, extraído do PRD>

## Documentos
- PRD: docs/04 - Produto/PRDs/<slug>.md
- SDD: docs/02 - Backend/SDDs/<slug>.md

## Checkpoints
- [x] PRD criado e aprovado
- [x] SDD criado e aprovado
- [ ] Mockup aprovado (se feature tem UI)
- [ ] Plan Mode executado e aprovado
- [ ] Backend implementado
- [ ] Frontend implementado
- [ ] Testes passando (typecheck + lint + jest)
- [ ] /ship executado com sucesso

## Contexto para próxima sessão
<resumo das decisões técnicas chave do SDD — 3 a 5 bullet points
que permitam a uma sessão futura continuar sem reler os docs completos>

## Histórico
- <data> — PRD e SDD aprovados, sessão iniciada
```

Depois, **sem esperar instrução**, avance automaticamente para a Etapa 3.5 (se houver mudança de UI) ou Etapa 4.

---

## Etapa 3.5 — Mockup de UI (obrigatório quando há mudança de tela)

**Quando aplicar:** sempre que o SDD listar telas afetadas em "Frontend → Telas afetadas". Pule esta etapa apenas se a feature for puramente backend (novo endpoint, model, script) sem nenhuma mudança visual.

Use `show_widget` para renderizar um mockup mobile fiel às telas afetadas. O mockup deve:
- Respeitar o design system atual do app (fundo escuro `#111`, dourado `#d4af37`, superfícies `#1a1a1a`)
- Mostrar o estado "cheio" (com dados de exemplo realistas — nomes de cartas, valores em BRL, badges)
- Cobrir os componentes novos e as mudanças nos existentes
- Se múltiplas telas forem afetadas, mostrar todas lado a lado

Após renderizar, pergunte explicitamente:

> Mockup acima. Está alinhado com o esperado? Ajusto antes de partir para a implementação.

**Só avance para a Etapa 4 após aprovação explícita do mockup.** Registre no artifact de sessão:
```
- [x] Mockup aprovado
```

---

## Etapa 4 — Plan Mode (aprovação antes de implementar)

Apresente o plano de implementação completo antes de tocar em qualquer arquivo. Use este formato:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 PLAN MODE — <Nome da Feature>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Arquivos que vou criar:
    + app/components/Foo.tsx
    + app/components/Bar.tsx

  Arquivos que vou modificar:
    ~ app/app/(tabs)/collection.tsx
        • adicionar estados X, Y, Z
        • substituir looseOnly pelo filteredItems com useMemo
        • adicionar SearchBar + ConditionChips acima do grid
    ~ app/app/binder/[id].tsx
        • adicionar slotSearch + slotCondition
        • filtrar slots antes de paginar (slots vazios sempre passam)
        • resetar currentPage ao mudar filtro

  Arquivos que NÃO vou tocar:
    - backend/ (nenhuma mudança de API)
    - docs/ (SDD já está atualizado)

  Ordem de execução:
    1. Criar componentes (SearchBar, ConditionChips, SortPicker, BinderListItem)
    2. Modificar collection.tsx
    3. Modificar binder/[id].tsx
    4. Rodar typecheck + lint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Posso iniciar? Responda "pode" para implementar
  ou peça ajustes antes.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Só inicie a implementação após aprovação explícita** ("pode", "sim", "vai", ou similar).

Ao receber aprovação, marque o checkpoint de Plan Mode na sessão e implemente na ordem definida.

> Se precisar pausar e retomar depois, use `/resume`.

---

## Notas

- PRDs ficam em `docs/04 - Produto/PRDs/` — crie a pasta se não existir
- SDDs ficam em `docs/02 - Backend/SDDs/` — crie a pasta se não existir
- Sessions ficam em `.claude/sessions/` — crie a pasta se não existir
- Slug da feature: kebab-case, descritivo (ex: `filtros-colecao`, `historico-precos`)
- Sempre leia o código atual antes de escrever o SDD — nunca assuma como está implementado
- Ao completar cada checkpoint durante a implementação, atualize `.claude/sessions/<slug>.md` imediatamente
- Após `/ship`, marque todos os checkpoints, mude status para `done` e registre no Histórico
