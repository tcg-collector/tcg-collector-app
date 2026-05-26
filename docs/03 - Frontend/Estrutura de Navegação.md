# 📱 Estrutura de Navegação — App Mobile

#frontend

## Mapa de telas

```
Root Stack (_layout.tsx)
│
├── (auth) — Telas de autenticação (sem header)
│   └── /sign-in → Login / Cadastro (sign-in.tsx)
│         Abas "Entrar" e "Criar conta" (e-mail + senha)
│         Botão "Continuar com Google" (OAuth)
│         Guard automático: autenticado → redireciona para (tabs)
│
└── (tabs) — Tab Bar inferior (exige autenticação)
    ├── / → Home (index.tsx)
    │     Saudação + cotação USD→BRL em tempo real
    │     Valor total da coleção
    │     Cartas em destaque com preço em BRL
    │
    ├── /collection → Coleção (collection.tsx)
    │     Summary bar (valor + contagens)
    │     Binders em scroll horizontal com preview do grid
    │     FAB (+) para criar binder
    │
    ├── /profile → Perfil (profile.tsx)
    │     Valor total da coleção com condições
    │     Distribuição por condição (barras)
    │     Top 5 cartas mais valiosas
    │     Top 3 sets da coleção
    │     Configurações e conta
    │
    ├── /binder/create → Criar Binder
    │     Foto de capa (galeria ou câmera)
    │     Nome do binder
    │     Seletor de grid (2x2 / 3x3 / 3x4 / 4x4)
    │
    └── /binder/[id] → Detalhe do Binder
          Grid de slots com imagens e preços por condição
          Long-press para remover carta
          Valor total do binder em BRL
          Modal de adicionar carta:
            ├── Aba Buscar: TextInput + FlatList + seletor de condição
            └── Aba Scan: CameraView → IA → candidatos + seletor de condição
```

---

## Auth Guard (`_layout.tsx`)

O `AuthGuard` é montado na raiz e:
1. Monitora `isLoaded` e `isSignedIn` do Clerk
2. Não autenticado → redireciona para `/(auth)/sign-in`
3. Autenticado + na tela de login → redireciona para `/(tabs)`
4. Chama `getToken()` e injeta via `setAuthToken()` para todas as requisições da API
5. Renova o token a cada 50 minutos (tokens Clerk duram 60 min)

---

## Tab Bar

| Tab | Ícone | Rota |
|-----|-------|------|
| Home | `home` | `/` |
| Coleção | `albums` | `/collection` |
| Perfil | `person` | `/profile` |

**Estilo**: fundo `#13131a` · ativo `#e8b84b` (Gold) · inativo `#8b8b9b` (Ash)

---

## Tela: Login (`/(auth)/sign-in`)

**Modos**: "Entrar" (sign-in) e "Criar conta" (sign-up) via abas  
**Campos**: e-mail + senha  
**OAuth**: Google (via `useOAuth({ strategy: 'oauth_google' })`)  
**Redirect**: `tcgbindex:///(tabs)` após autenticação bem-sucedida

---

## Tela: Home (`/`)

Dados reais do backend (conectado).

**Seções:**
1. **Header** — Saudação + ícone de notificação
2. **Market Row** — Cotação USD→BRL em tempo real, valor total da coleção
3. **Em destaque** — Scroll horizontal de cartas com preço em BRL
4. **Adicionar carta** — CTA de ação rápida

**Integração**: `GET /api/cards` + taxa de câmbio via `useExchangeRate()`

---

## Tela: Coleção (`/collection`)

Dados reais do backend (conectado).

**Seções:**
1. **Summary bar** — Valor total em BRL · nº de cartas · nº de binders
2. **Binders** — Scroll horizontal com card de cada binder, preview do grid e valor total
3. **FAB** — Botão `+` para criar binder

**Interações:**
- Tap no binder → navega para `/binder/[id]`
- Long-press no binder → confirmação de exclusão
- Tap no `+` → navega para `/binder/create`

**Integração**: `useBinders()` hook → `GET /api/binders`

---

## Tela: Perfil (`/profile`)

Dados calculados a partir dos binders do usuário.

**Seções:**
1. **Hero** — Avatar, nome, e-mail, badge de plano
2. **Stats grid** — Total de cartas · Valor total BRL · Nº de binders
3. **Distribuição por condição** — Barras horizontais (NM/LP/MP/HP/DMG) com % e contagem
4. **Cartas mais valiosas** — Top 5 com imagem, set, badge de condição, binder de origem, valor
5. **Sets na coleção** — Top 3 sets com contagem de cartas
6. **Configurações** — Moeda, sync, exportar, alertas, conta

**Hook**: `useCollectionStats()` agrega dados de `useBinders()` + `useExchangeRate()`

---

## Tela: Criar Binder (`/binder/create`)

**Campos:**
- **Foto de capa**: seleção via galeria (`expo-image-picker`) ou câmera (`expo-camera`)
- **Nome**: TextInput livre
- **Grid**: seletor visual com 4 opções (2×2, 3×3, 3×4, 4×4)

**Ação**: `POST /api/binders` → redireciona para `/binder/[id]`

---

## Tela: Detalhe do Binder (`/binder/[id]`)

**Grid de slots:**
- Layout responsivo baseado no `gridConfig` do binder
- Slot vazio: ícone `+` + número do slot
- Slot com carta: imagem da carta + preço em BRL (ajustado pela condição) + badge de condição (NM/LP/etc.)
- Long-press em slot com carta → confirmação de remoção

**Valor total**: soma `preço_base × multiplicador_condição × taxa_BRL` de todos os slots

**Modal de adicionar carta:**

### Aba Buscar
1. TextInput + botão de busca
2. FlatList de resultados: imagem, nome, set, raridade, **preço NM em BRL**
3. Tap na carta → painel de confirmação:
   - Imagem + nome + set + raridade
   - Destaque do preço estimado para a condição selecionada
   - Seletor de condição (NM/LP/MP/HP/DMG) com preço de cada grade
   - Botão "Adicionar ao slot"

### Aba Scan
1. `CameraView` com frame dourado de enquadramento
2. Botão "Identificar carta" → foto → chama `POST /api/scan`
3. Resultado: nome identificado, set, confiança (%)
4. Lista de candidatos com imagem, set, raridade, **preço NM em BRL**
5. Tap no candidato → mesmo painel de confirmação da busca manual
6. Botão "Escanear novamente"

**Integração**: `useBinder(id)` hook → `GET /api/binders/:id` + `PATCH /api/binders/:id/slots/:position`

---

## Serviços e Hooks

| Arquivo | Descrição |
|---------|-----------|
| `services/api.ts` | Cliente HTTP base com auth token automático |
| `services/cards.ts` | `cardsService.list()`, `cardsService.get()` |
| `services/binders.ts` | `binderService.*`, `scanService.scan()`, `GRID_CONFIGS` |
| `hooks/useBinders.ts` | `useBinders()`, `useBinder(id)` |
| `hooks/useExchangeRate.ts` | Taxa USD→BRL em tempo real |
| `constants/colors.ts` | Tokens de cor do design system |

---

## Variáveis de ambiente (frontend)

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Configurado em `app/.env` (não commitado).

---

## Paleta de cores

| Token | Hex | Uso |
|-------|-----|-----|
| `void` | `#0c0c10` | Background geral |
| `surface` | `#13131a` | Cards, modais, tab bar |
| `surface2` | `#1a1a24` | Inputs, chips ativos |
| `snow` | `#f5f5f7` | Texto principal |
| `ash` | `#8b8b9b` | Texto secundário |
| `gold` | `#e8b84b` | Acento, FABs, CTAs |
| `mint` | `#4ade80` | Preços, positivo |
| `sky` | `#60a5fa` | Info |
| `ember` | `#fb923c` | Aviso |
| `crimson` | `#f87171` | Erro, negativo |
| `border` | `#2a2a38` | Bordas sutis |

---

*Veja também: [[../02 - Backend/API Reference]] · [[../01 - Arquitetura/Visão Geral do Sistema]]*
