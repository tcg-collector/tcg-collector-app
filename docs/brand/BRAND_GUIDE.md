# TCG Bindex — Identidade Visual v1.0

## Conceito
Dark-first. Escuro profundo com ouro como único destaque vibrante.
Sensação de raridade e colecionismo premium, pensada para o colecionador brasileiro.

---

## Paleta de Cores

| Nome      | Hex       | Uso                                      |
|-----------|-----------|------------------------------------------|
| Gold      | `#e8b84b` | Primária — CTAs, preços, destaques, active states |
| Void      | `#0c0c10` | Background principal                     |
| Surface   | `#13131a` | Cards, componentes, bottom sheet         |
| Surface 2 | `#1a1a24` | Inputs, cards aninhados, modais          |
| Snow      | `#f5f5f7` | Texto primário                           |
| Ash       | `#8b8b9b` | Texto secundário / muted                 |
| Mint      | `#4ade80` | Valor positivo, sucesso, preço subindo   |
| Sky       | `#60a5fa` | Info, links, preço secundário (USD)      |
| Ember     | `#fb923c` | Alerta, atenção, condição LP/MP          |
| Crimson   | `#f87171` | Erro, queda de preço, condição HP/DMG    |

### Regra de uso do Gold
Usar apenas em:
- CTAs e botões primários
- Preço principal (BRL)
- Badges de raridade
- Elementos interativos no estado ativo/selecionado
- Bordas de destaque (ex: card em destaque)

Nunca usar em texto corrido ou parágrafos.

---

## Tipografia

**Fonte primária:** Inter (Google Fonts)
**Fallback:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

| Uso             | Tamanho | Peso | Cor             |
|-----------------|---------|------|-----------------|
| Display / Nome  | 28px    | 600  | Snow #f5f5f7    |
| Heading 1       | 22px    | 600  | Snow #f5f5f7    |
| Heading 2       | 18px    | 500  | Snow #f5f5f7    |
| Body            | 15px    | 400  | Snow #f5f5f7    |
| Caption / Meta  | 12px    | 400  | Ash #8b8b9b     |
| Preço principal | 24px    | 700  | Gold #e8b84b    |
| Preço secundário| 14px    | 400  | Sky #60a5fa     |

---

## Ícone do App

**Conceito:** Binder com cartas empilhadas em perspectiva + badge circular com "B" em ouro.
Representa a organização da coleção. O empilhamento de cartas remete ao colecionismo físico.

**Especificações:**
- Fundo: `#0c0c10` com border-radius de 22.5% (padrão iOS/Android)
- Bordas das cartas: `#e8b84b` (1.5px)
- Badge "B": círculo dourado sólido `#e8b84b`, letra em `#0c0c10`, peso 700

**Tamanhos necessários:**
- 1024×1024 (App Store / Play Store source)
- 180×180 (iPhone @3x)
- 120×120 (iPhone @2x)
- 192×192 (Android xxhdpi)
- 96×96 (Android xhdpi)
- 48×48 (launcher preview)
- 32×32 (favicon web)

---

## Tom Visual

- **Dark-first**: nunca light mode no MVP. Considerar tema claro opcional em versões futuras.
- **Minimalista**: muito espaço em branco (ou melhor: espaço escuro). Poucas informações por tela.
- **Ouro como destaque único**: evitar múltiplas cores vibrantes na mesma tela.
- **Cards arredondados**: border-radius 12px para cards, 8px para elementos menores.

---

## Assets a produzir (Fase 0 → Fase 1)

- [ ] Ícone SVG final (todas as resoluções)
- [ ] Splash screen (logo + tagline no Void)
- [ ] Logo horizontal (ícone + "TCG Bindex" em Inter 600)
- [ ] Logo mark isolado (só o ícone, sem texto)
