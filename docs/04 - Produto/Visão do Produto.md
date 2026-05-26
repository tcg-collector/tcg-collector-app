# 🎯 Visão do Produto

#produto

## Tagline
> *"Seu binder digital — saiba exatamente o que você tem, o quanto vale e o que falta."*

## Problema
Colecionadores brasileiros de Pokémon TCG físico não têm uma ferramenta em português que:
- Liste e organize as cartas que possuem (o binder)
- Mostre o valor da coleção em BRL (não só USD)
- Rastreie histórico de preços
- Funcione offline para consultas rápidas

## Solução
App mobile que funciona como um **binder digital inteligente**, com preços em tempo real convertidos para BRL, scan com IA e autenticação segura por conta.

## Público-alvo
Colecionadores brasileiros de Pokémon TCG físico, especialmente:
- Iniciantes organizando o primeiro binder
- Colecionadores sérios que querem saber o valor exato da coleção
- Pessoas querendo vender cartas e precisam de referência de preço

## Proposta de valor
| Benefício | Como entregamos |
|-----------|-----------------|
| Organização | Binder digital com busca e scan por IA |
| Preço em BRL | Sync diário USD→BRL via ExchangeRate API |
| Condição real | Seletor NM/LP/MP/HP/DMG com preço estimado por grade |
| Conta segura | Auth via Clerk (e-mail + Google OAuth) |
| Histórico | Gráfico de evolução de preço por carta (Fase 2) |
| Completude | Wishlist + % de completude de expansões (Fase 3) |

## Fases do produto

### Fase 0 — Fundação ✅
Produto, design, dados, backend, ambiente de desenvolvimento

### Fase 1 — MVP Core ✅
- App React Native com navegação completa (Home, Coleção, Perfil)
- Binder digital (CRUD de cartas com grade de condição)
- Preços em BRL em tempo real com multiplicadores de condição
- Scan com IA (Claude Vision — nome, set, número, condição)
- Autenticação Clerk (e-mail + Google OAuth)
- Perfil com estatísticas reais da coleção

### Fase 2 — Publicação
- App Store + Play Store (build de produção)
- Alertas de preço (wishlist)
- Histórico de preços com gráfico
- Busca avançada (filtro por set, raridade, condição)

### Fase 3 — Crescimento
- Planos pagos (Bindex Pro)
- Comunidade (troca/venda entre usuários)
- Integração com marketplaces brasileiros

---

*Veja também: [[Modelo de Negócio]] · [[../01 - Arquitetura/Visão Geral do Sistema]]*
