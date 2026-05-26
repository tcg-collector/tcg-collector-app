# ADR-005 — expo-router para navegação (file-based routing)

#arquitetura #decisão

**Status**: ✅ Aprovada  
**Data**: maio 2026

## Contexto
React Native tem várias opções de navegação. Precisamos de algo simples, que suporte abas + stack, e que funcione bem com TypeScript.

## Decisão
Usar **expo-router v4** com roteamento baseado em arquivos (igual ao Next.js).

Estrutura:
```
app/
├── _layout.tsx          ← root
├── (tabs)/
│   ├── _layout.tsx      ← tab bar
│   ├── index.tsx        ← /
│   ├── collection.tsx   ← /collection
│   └── profile.tsx      ← /profile
└── card/[id].tsx        ← /card/base1-4
```

## Consequências

### Positivas
- URL-based: `/card/base1-4` funciona igual na web e no mobile
- Deep linking automático
- TypeScript types para rotas (`typedRoutes: true` no app.json)
- Curva de aprendizado suave para quem conhece Next.js
- Suporte nativo a layouts aninhados

### Negativas / trade-offs
- Mais "mágico" que React Navigation direto
- Estrutura de pastas define a navegação (boa e má notícia)

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|----------------------|
| React Navigation | Mais verboso, configuração manual |
| React Native Navigation (Wix) | Mais complexo, menos integrado com Expo |

---
*Veja também: [[../../03 - Frontend/Estrutura de Navegação]]*
