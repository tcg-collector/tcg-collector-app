# SDD — Perfil: Limpeza Visual e Tags "Em Breve"

**PRD:** [[PRDs/perfil-limpeza-em-breve]]  
**Status:** Draft  
**Data:** 2026-06-16

---

## Visão técnica

Modificação cirúrgica em `profile.tsx`: adicionar badge "Em breve" em 4 itens sem funcionalidade, remover seção "Notificações" (alertas migram para "Conta"), e corrigir `useCollectionStats` para somar cartas avulsas via `useCollection`.

---

## Backend

Nenhuma mudança.

---

## Frontend

### Telas afetadas

- `app/app/(tabs)/profile.tsx` — única tela modificada

### Mudanças em `SettingRow`

Adicionar prop opcional `comingSoon?: boolean`. Quando `true`:
- Exibe badge dourado `Em breve` no lugar da seta ou do toggle
- `TouchableOpacity` recebe `disabled={true}` (sem feedback de toque)

```tsx
interface SettingRowProps {
  // ... props existentes ...
  comingSoon?: boolean;  // ← novo
}
```

Renderização do `settingRight` quando `comingSoon`:
```tsx
<View style={styles.comingSoonBadge}>
  <Text style={styles.comingSoonText}>Em breve</Text>
</View>
```

### Mudanças nas seções de configuração

**Seção "Coleção"** (mantida):
- "Moeda" → sem mudança (BRL, informativo)
- "Sync de preços" → sem mudança (Diário, informativo)  
- "Exportar coleção" → adicionar `comingSoon` (remove seta, desabilita toque)

**Seção "Notificações"** → **removida**

**Seção "Conta"** (expandida com alertas):
```
Alerta de alta       [Em breve]
Alerta de baixa      [Em breve]
Assinar Bindex Pro   [Em breve]   ← já existia com value="Em breve", migra para comingSoon
Ajuda & Suporte      [Em breve]
Sobre o app          v1.0.0
Sair                 (danger)
```

### Correção do `useCollectionStats`

Problema atual: usa apenas `useBinders()` — conta só slots preenchidos em binders.

Solução: importar também `useCollection` e somar ao total:

```ts
function useCollectionStats() {
  const { binders, loading: loadingBinders } = useBinders();
  const { items: looseItems, loading: loadingLoose, totalValueUSD: looseValueUSD } = useCollection();
  const { rate } = useExchangeRate();

  if (loadingBinders || loadingLoose || !rate) return { loading: true, stats: null };

  // ... cálculo de binders (sem mudança) ...

  // Totais combinados
  const totalCards  = allSlots.length + looseItems.length;
  const totalValue  = (binderValue + looseValueUSD * rate);  // looseValueUSD já vem do hook
  // ...
}
```

`useCollection` já expõe `totalValueUSD` (soma dos market prices das cartas avulsas). Multiplicador de condição das avulsas é tratado pelo hook — apenas somamos o valor bruto.

### Estados e fluxo de dados

Nenhum estado novo. A correção de stats é puramente aditiva no hook existente.

---

## Testes a escrever

- Nenhum (mudanças visuais + hook já coberto pelos testes de integração existentes)
- Typecheck + lint antes do ship

---

## Arquivos a tocar

```
app/
  app/(tabs)/profile.tsx    ← único arquivo modificado
```

---

## Riscos e trade-offs

- **`useCollection` adiciona um fetch extra no Perfil**: a tela já carregava binders; agora carrega também a coleção avulsa. Loading unificado até ambos resolverem — sem impacto perceptível.
- **Valor total pode mudar para o usuário**: se ele tinha cartas avulsas, o número sobe. É a correção desejada, não um bug.
- **`comingSoon` desabilita o toque mas não muda a cor do label**: manter legibilidade — o badge já comunica o estado.
