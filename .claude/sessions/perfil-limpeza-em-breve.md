# Sessão: Perfil — Limpeza Visual e Tags "Em Breve"

**Slug:** perfil-limpeza-em-breve  
**Status:** done  
**Iniciada:** 2026-06-16  
**Objetivo:** Adicionar badge "Em breve" nos 4 itens sem funcionalidade, remover seção "Notificações" e corrigir stats para incluir cartas avulsas.

## Documentos
- PRD: docs/04 - Produto/PRDs/perfil-limpeza-em-breve.md
- SDD: docs/02 - Backend/SDDs/perfil-limpeza-em-breve.md

## Checkpoints
- [x] PRD criado e aprovado
- [x] SDD criado e aprovado
- [x] Plan Mode executado e aprovado
- [ ] Backend implementado (N/A)
- [x] Frontend implementado
- [x] Testes passando (typecheck + lint)
- [x] /ship executado com sucesso

## Contexto para próxima sessão
- **Único arquivo modificado**: `app/app/(tabs)/profile.tsx`
- **`SettingRow` ganha prop `comingSoon?: boolean`** — badge dourado + disabled, sem toggle/seta
- **Seção "Notificações" removida** — alertas (alta/baixa) migram para seção "Conta" com `comingSoon`
- **`useCollectionStats` corrigido**: importar `useCollection` e somar `looseItems.length` + `looseValueUSD * rate` aos totais de binders
- **4 itens com `comingSoon`**: Exportar coleção, Alerta de alta, Alerta de baixa, Ajuda & Suporte

## Histórico
- 2026-06-16 — PRD e SDD aprovados, sessão iniciada
