# ADR-004 — TypeScript strict mode no backend

#arquitetura #decisão

**Status**: ✅ Aprovada  
**Data**: maio 2026

## Contexto
Projeto solo significa que não há revisão de código de outra pessoa. Erros de tipo em runtime são custosos de debugar.

## Decisão
Usar **TypeScript com `strict: true`** no backend e no frontend.

## Consequências

### Positivas
- Erros de tipo capturados em build-time, não em runtime
- Intellisense completo no VS Code
- Refactoring muito mais seguro
- Interfaces documentam a forma dos dados (substitui parte da documentação)

### Negativas / trade-offs
- Curva de aprendizado inicial (especialmente com Mongoose)
- Tipos do Mongoose podem ser verbosos
- Bug encontrado: `extends Document` com `_id: string` → resolvido removendo a herança

## Lição aprendida

```typescript
// ❌ ERRADO — causa TS2430
export interface ICard extends Document {
  _id: string; // conflita com ObjectId do Document
}

// ✅ CORRETO — interface pura
export interface ICard {
  _id: string;
  name: string;
  // ...
}
const CardSchema = new Schema<ICard>(...); // tipagem funciona sem herança
```

---
*Veja também: [[../Visão Geral do Sistema]]*
