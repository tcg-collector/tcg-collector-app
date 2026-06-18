# PRD — Perfil: Limpeza Visual e Tags "Em Breve"

**Status:** Draft  
**Data:** 2026-06-16  
**Fase do produto:** Fase 2

---

## Problema

A tela de Perfil tem itens que prometem funcionalidades que não existem: toggles de alerta que não fazem nada, "Exportar coleção" sem ação, "Ajuda & Suporte" sem destino. Para o usuário, isso cria confusão — ele toca num botão e nada acontece. A tela precisa ser honesta: mostrar claramente o que funciona hoje e sinalizar o que está chegando.

Além disso, as estatísticas de coleção só consideram cartas em binders, ignorando as cartas avulsas — o "Valor total" e contagem de cartas exibidos no Perfil estão incompletos.

## Solução

Três mudanças cirúrgicas:

1. **Tags "Em breve"** nas linhas sem funcionalidade ativa:
   - "Exportar coleção" → badge `Em breve` no lugar da seta
   - "Alerta de alta" e "Alerta de baixa" → substituir toggle por badge `Em breve` (toggle que não faz nada é mais confuso que texto)
   - "Ajuda & Suporte" → badge `Em breve` no lugar da seta

2. **Corrigir stats de coleção**: o `useCollectionStats` atual só conta cartas em binders. Adicionar também as cartas avulsas via `useCollection`, de modo que "Cartas" e "Valor total" reflitam a coleção completa do usuário.

3. **Remover a seção "Notificações"** como seção separada — "Alerta de alta" e "Alerta de baixa" com badge "Em breve" migram para dentro da seção "Conta" (como preview do que vem na Fase 3), eliminando uma seção órfã.

## Usuário-alvo

Qualquer colecionador autenticado que abre a tela de perfil para ver suas estatísticas ou acessar configurações.

## Critérios de aceite

- [ ] "Exportar coleção" exibe badge "Em breve" e não responde a toque (desabilitado)
- [ ] "Alerta de alta" e "Alerta de baixa" exibem badge "Em breve" sem toggle
- [ ] "Ajuda & Suporte" exibe badge "Em breve" e não responde a toque
- [ ] Seção "Notificações" removida — alertas movidos para seção "Conta" com badge "Em breve"
- [ ] Stats grid conta cartas avulsas + binders (total real)
- [ ] "Valor total" no stats grid inclui valor das cartas avulsas
- [ ] Nenhuma regressão nas funcionalidades existentes (logout, stats de binders, top cartas, sets)

## Fora do escopo

- Implementar qualquer das features marcadas "Em breve"
- Alterar o visual do hero (avatar, email, badge "Plano Gratuito")
- Criar tela de ajuda ou suporte
- Alterar navegação entre tabs
- Mudanças de backend

## Impacto esperado

O usuário para de tocar em botões que não respondem. As estatísticas passam a refletir a coleção real completa. A tela transmite confiança: "o que tem aqui funciona, o que não tem está sinalizado como Em breve".

## Dependências

- `useCollection` hook (já existe) — será importado no Perfil para incluir cartas avulsas no total
