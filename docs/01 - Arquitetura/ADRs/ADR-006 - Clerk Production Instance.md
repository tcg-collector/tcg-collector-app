# ADR-006 — Uso da Instância Clerk Production Correta

#arquitetura #decisão #auth

**Status**: ✅ Aprovada
**Data**: 2026-05-29

## Contexto

Em produção (`tcgbindex.app`), todos os requests ao backend retornavam `401 Auth falhou: Unable to find a signing key in JWKS`. O erro indicava que o `kid` do token JWT (`ins_3EHQ039FfIy132LjCHlgN4s31P0`) não batia com o `kid` disponível no JWKS do Railway (`ins_3EJspAGa5eG1CFreq1uCfdWlp2Y`).

## Diagnóstico

O Vercel havia sido deployado com o `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` da instância **Development** (`pk_test_`) de uma build anterior, enquanto o Railway foi atualizado para usar o `CLERK_SECRET_KEY` da instância **Production** (`sk_live_`). As duas instâncias têm `kid`s diferentes, causando falha na verificação do JWT.

Evidência adicional: a chave `pk_live_` da instância Production mostrava **"Never used"** no Clerk Dashboard — confirmando que nenhum build do Vercel havia usado a chave correta ainda.

## Decisão

1. Garantir que `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` no Vercel seja sempre `pk_live_...` da instância **Production** do Clerk
2. Garantir que `CLERK_SECRET_KEY` no Railway seja sempre `sk_live_...` da **mesma instância Production**
3. Após qualquer mudança de variável de ambiente no Vercel, acionar um **redeploy manual** para regravar as variáveis no bundle estático

## Consequências

### Positivas
- Auth funcionando em produção para todos os usuários
- Tokens JWT verificados corretamente pelo backend

### Negativas / trade-offs
- Variáveis `EXPO_PUBLIC_*` são baked-in no bundle em build-time — mudanças exigem redeploy

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|----------------------|
| Usar instância Development em produção | Inseguro, não tem domínio customizado configurado |
| Usar `jwtKey` (PEM) em vez de `secretKey` | Mais complexo, exige rotação manual de chaves |

---
*Veja também: [[../../../02 - Backend/API Reference]] · [[ADR-001 - React Native + Expo]]*
