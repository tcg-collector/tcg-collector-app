# ADR-002 — MongoDB Atlas como banco de dados

#arquitetura #decisão

**Status**: ✅ Aprovada  
**Data**: maio 2026

## Contexto
Precisamos de um banco de dados que seja gratuito para o MVP, suporte dados flexíveis (nem toda carta tem os mesmos campos), e tenha boa integração com Node.js.

## Decisão
Usar **MongoDB Atlas M0** (free tier) com Mongoose como ODM.

- Cluster: sa-east-1 (São Paulo)  
- Database: `bindex-tcg`  
- Tier: M0 (512 MB, gratuito para sempre)

## Consequências

### Positivas
- M0 é **100% gratuito, sem expiração**
- Dados de cartas Pokémon são naturalmente semi-estruturados (nem toda carta tem HP, energy, etc.)
- Mongoose oferece validação de schema mesmo no MongoDB
- Time Series Collections para histórico de preços
- Atlas UI intuitivo para inspecionar dados

### Negativas / trade-offs
- M0 não suporta transações multi-documento completas
- Sem agregações complexas no M0 (algumas operações bloqueadas)
- Schema-less pode ser uma faca de dois gumes sem disciplina

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|----------------------|
| PostgreSQL (Supabase) | Relacional demais para dados de cartas; mais complexo para schema evolutivo |
| SQLite | Sem suporte cloud nativo, não escala |
| Firebase Firestore | Vendor lock-in Google, preços podem surpreender |
| PlanetScale (MySQL) | Migrações de schema mais trabalhosas |

---
*Veja também: [[../Visão Geral do Sistema]] · [[ADR-001 - React Native + Expo]]*
