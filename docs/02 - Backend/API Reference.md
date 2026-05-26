# 🔌 API Reference — Bindex TCG Backend

#backend

**Base URL (local)**: `http://localhost:3000`  
**Base URL (produção)**: `https://api.tcgbindex.app` *(a definir)*

---

## Autenticação

Todas as rotas `/api/binders` e `/api/scan` exigem autenticação via **Clerk JWT**.

**Header obrigatório:**
```
Authorization: Bearer <clerk_jwt_token>
```

O token é obtido automaticamente pelo frontend via `getToken()` do Clerk e renovado a cada 50 minutos.

**Erros de autenticação:**
- `401 Token não fornecido` — header ausente
- `401 Token inválido ou expirado` — JWT inválido ou expirado

---

## Health Check

### `GET /health`
Verifica se a API está rodando. Rota pública.

```json
{ "status": "ok", "app": "Bindex TCG API", "version": "1.0.0", "timestamp": "..." }
```

---

## Cards

### `GET /api/cards`
Lista cartas com paginação e filtros. Rota pública.

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `page` | number | 1 | Página |
| `limit` | number | 20 | Itens por página (máx 100) |
| `set` | string | — | Filtrar por ID da expansão |
| `name` | string | — | Busca parcial por nome |

### `GET /api/cards/:id`
Retorna uma carta pelo ID da PokéTCG API (ex: `base1-4`). Rota pública.

---

## Binders

> ⚠️ Todas as rotas de binders exigem `Authorization: Bearer <token>`

### `GET /api/binders`
Lista todos os binders **do usuário autenticado** com slots populados (cartas, imagens, preços).

**Resposta:**
```json
{
  "data": [
    {
      "_id": "...",
      "name": "Meu Binder",
      "gridConfig": "3x3",
      "coverPhotoUrl": "...",
      "slots": [
        {
          "position": 0,
          "cardId": "swsh4-25",
          "condition": "NM",
          "quantity": 1,
          "language": "EN",
          "card": { "_id": "swsh4-25", "name": "Pikachu", "images": {...}, "prices": {...}, "set": {...} }
        }
      ],
      "createdAt": "..."
    }
  ]
}
```

### `POST /api/binders`
Cria um novo binder vinculado ao usuário autenticado.

**Body:**
```json
{
  "name": "Meu Binder",
  "gridConfig": "3x3",
  "coverPhotoUrl": "data:image/jpeg;base64,..."
}
```

Configs disponíveis: `"2x2"` (4 slots) · `"3x3"` (9) · `"3x4"` (12) · `"4x4"` (16)

### `GET /api/binders/:id`
Retorna detalhe de um binder com todos os slots e cartas populadas. Valida que o binder pertence ao usuário.

### `PATCH /api/binders/:id/slots/:position`
Adiciona, atualiza ou remove uma carta de um slot.

**Body:**
```json
{
  "cardId": "swsh4-25",
  "condition": "NM",
  "quantity": 1,
  "language": "EN"
}
```

Para remover a carta: `{ "cardId": null }`

**Resposta**: binder completo com slots populados.

### `DELETE /api/binders/:id`
Exclui um binder. Valida que pertence ao usuário.

---

## Scan (IA)

> ⚠️ Exige `Authorization: Bearer <token>`

### `POST /api/scan`
Identifica uma carta Pokémon por foto usando Claude Vision, avalia a condição e retorna candidatos da PokéTCG API.

**Body:**
```json
{ "image": "data:image/jpeg;base64,..." }
```

**Resposta:**
```json
{
  "data": {
    "identified": {
      "name": "Piplup",
      "set": "Paldean Fates",
      "setCode": "PFL",
      "number": "027",
      "condition": "NM",
      "conditionReason": "Carta em excelente estado, sem marcas visíveis, em sleeve protetor.",
      "confidence": 0.88
    },
    "candidates": [
      { "_id": "sv4pt5-27", "name": "Piplup", "images": {...}, "set": {...}, "prices": {...} }
    ]
  }
}
```

**Estratégia de busca**: primeiro tenta `name + number` (preciso), depois fallback por nome apenas.  
**Modelo IA**: `claude-opus-4-5` via Anthropic API (vision).  
**Limite de imagem**: 15 MB.

---

## Exchange Rate

### Taxa USD→BRL
Gerenciada internamente via `ExchangeRateService`. Cache de 1 hora no MongoDB.  
Fonte: `open.er-api.com` (gratuito, sem chave). Fallback: 5.72.

---

## Preços por condição (frontend)

O backend retorna sempre o preço de mercado (TCGPlayer market price) sem ajuste de condição.  
O frontend aplica multiplicadores padrão do mercado TCG:

| Condição | Multiplicador |
|----------|--------------|
| NM | 100% |
| LP | 80% |
| MP | 60% |
| HP | 40% |
| DMG | 20% |

---

## Códigos de status

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Criado com sucesso |
| 400 | Bad Request |
| 401 | Não autenticado |
| 404 | Não encontrado |
| 422 | Não foi possível processar (ex: IA não identificou carta) |
| 500 | Erro interno |

---

*Veja também: [[Modelos de Dados]] · [[../01 - Arquitetura/Visão Geral do Sistema]]*
