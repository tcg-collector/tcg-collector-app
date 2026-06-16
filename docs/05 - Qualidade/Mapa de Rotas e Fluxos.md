# Mapa Oficial de Rotas e Fluxos — TCG Bindex

> **Doc oficial de referência para o Agent Tester e monitoramento sintético.**
> Atualizado em: Junho/2026 | Versão: 3.0

---

## Backend — 21 Rotas API

### Saúde

| Método | Rota | Auth | Valor pro usuário |
|--------|------|------|-------------------|
| GET | `/health` | público | Confirma que o servidor está vivo e respondendo |

### Cartas

| Método | Rota | Auth | Valor pro usuário |
|--------|------|------|-------------------|
| GET | `/api/cards` | 🔒 Clerk JWT | Busca cartas por nome ou set para montar a coleção |
| GET | `/api/cards/:id` | 🔒 Clerk JWT | Detalhe completo de uma carta (arte, raridade, texto) |

### Sets

| Método | Rota | Auth | Valor pro usuário |
|--------|------|------|-------------------|
| GET | `/api/sets` | 🔒 Clerk JWT | Lista todos os sets disponíveis para filtrar busca |

### Coleção

| Método | Rota | Auth | Valor pro usuário |
|--------|------|------|-------------------|
| GET | `/api/collections` | 🔒 Clerk JWT | Retorna todas as cartas salvas na coleção do usuário |
| POST | `/api/collections` | 🔒 Clerk JWT | Adiciona uma carta à coleção pessoal |
| DELETE | `/api/collections/:id` | 🔒 Clerk JWT | Remove uma carta da coleção |
| GET | `/api/collections/top-gainers` | 🔒 Clerk JWT | Top valorizações da coleção do usuário (7/30/60d) |
| GET | `/api/collections/top-value` | 🔒 Clerk JWT | Cartas mais valiosas da coleção do usuário |
| GET | `/api/collections/summary` | 🔒 Clerk JWT | Valor total + variação percentual da coleção (7/30/60d) |

### Binders

| Método | Rota | Auth | Valor pro usuário |
|--------|------|------|-------------------|
| GET | `/api/binders` | 🔒 Clerk JWT | Lista todos os binders criados pelo usuário |
| POST | `/api/binders` | 🔒 Clerk JWT | Cria um novo binder com nome e capa personalizada |
| GET | `/api/binders/:id` | 🔒 Clerk JWT | Abre binder completo com todas as páginas e slots |
| PATCH | `/api/binders/:id/slots/:position` | 🔒 Clerk JWT | Coloca ou move carta em slot específico do binder |
| POST | `/api/binders/:id/pages` | 🔒 Clerk JWT | Adiciona nova página ao binder para mais cartas |
| DELETE | `/api/binders/:id` | 🔒 Clerk JWT | Exclui binder e libera espaço na conta |

### Preços

| Método | Rota | Auth | Valor pro usuário |
|--------|------|------|-------------------|
| GET | `/api/prices/exchange` | 🔒 Clerk JWT | Cotação USD→BRL atual para exibir preços em reais |
| GET | `/api/prices/:cardId` | 🔒 Clerk JWT | Preço de mercado de uma carta específica (TCGPlayer) |
| GET | `/api/prices/top-gainers` | 🔒 Clerk JWT | Top valorizações do catálogo global (7/30/60d) |
| GET | `/api/prices/top-value` | 🔒 Clerk JWT | Cartas mais valiosas do catálogo global |

### Scan

| Método | Rota | Auth | Valor pro usuário |
|--------|------|------|-------------------|
| POST | `/api/scan` | 🔒 Clerk JWT · rate 10/min | Identifica carta por foto da câmera (OCR + AI match) |

---

## Frontend — 19 Fluxos de Usuário

### Autenticação

| # | Fluxo | Valor pro usuário | Rotas envolvidas |
|---|-------|-------------------|-----------------|
| 1 | Login / Cadastro | Usuário entra ou cria conta via Clerk para acessar tudo | nenhuma (Clerk SDK) |

### Descoberta

| # | Fluxo | Valor pro usuário | Rotas envolvidas |
|---|-------|-------------------|-----------------|
| 2 | Busca de Cartas | Encontra cartas por nome para ver valor e detalhes | GET /api/cards · GET /api/sets |
| 3 | Detalhe de Carta | Vê arte completa, raridade, preço e texto de habilidade | GET /api/cards/:id · GET /api/prices/:cardId |
| 4 | Scan de Carta pela Câmera | Aponta câmera para carta física e identifica automaticamente | POST /api/scan |

### Coleção

| # | Fluxo | Valor pro usuário | Rotas envolvidas |
|---|-------|-------------------|-----------------|
| 5 | Ver Minha Coleção | Acessa todas as cartas salvas (binders + avulsas) em um só lugar | GET /api/collections · GET /api/binders |
| 6 | Adicionar Carta à Coleção | Salva uma carta encontrada ou escaneada na coleção | POST /api/collections |
| 7 | Remover Carta da Coleção | Limpa cartas vendidas ou duplicadas da coleção | DELETE /api/collections/:id |
| 8 | Inteligência de Valor da Coleção | Vê resumo de valor total, maiores valorizações e cartas mais valiosas da própria coleção | GET /api/collections/summary · GET /api/collections/top-gainers · GET /api/collections/top-value · GET /api/prices/exchange |

### Binders

| # | Fluxo | Valor pro usuário | Rotas envolvidas |
|---|-------|-------------------|-----------------|
| 9 | Ver Meus Binders | Lista todos os álbuns criados para organizar cartas | GET /api/binders |
| 10 | Criar Binder | Cria novo álbum temático com nome e capa | POST /api/binders |
| 11 | Abrir Binder | Navega pelas páginas do álbum e vê cartas organizadas | GET /api/binders/:id |
| 12 | Colocar Carta em Slot | Organiza carta em posição específica da página do binder | PATCH /api/binders/:id/slots/:pos |
| 13 | Adicionar Página ao Binder | Expande o álbum para caber mais cartas | POST /api/binders/:id/pages |
| 14 | Excluir Binder | Remove álbum que não é mais necessário | DELETE /api/binders/:id |

### Preços & Mercado

| # | Fluxo | Valor pro usuário | Rotas envolvidas |
|---|-------|-------------------|-----------------|
| 15 | Ver Preço em Reais | Exibe valor de mercado da carta convertido para BRL | GET /api/prices/:cardId · GET /api/prices/exchange |
| 16 | Home — Mercado Global | Vê carrosséis de maiores valorizações e cartas mais valiosas do catálogo | GET /api/prices/top-gainers · GET /api/prices/top-value · GET /api/prices/exchange |

### Perfil

| # | Fluxo | Valor pro usuário | Rotas envolvidas |
|---|-------|-------------------|-----------------|
| 17 | Ver Estatísticas do Perfil | Vê total de cartas, valor e binders (binders + avulsas combinados) | GET /api/binders · GET /api/collections |
| 18 | Filtros e Busca na Coleção | Filtra cartas avulsas por condição, nome e ordenação | GET /api/collections |
| 19 | Filtros e Busca no Binder | Filtra slots do binder por condição e nome | GET /api/binders/:id |

---

## Notas para o Agent Tester

- **20 das 21 rotas exigem autenticação** — o Agent Tester precisa de credenciais Clerk armazenadas como GitHub Secrets
- **`/health` é pública** — sempre deve ser o primeiro check, funciona sem token
- **`POST /api/scan` tem rate limit de 10/min** — payload sintético 1x1px é usado para confirmar rota ativa sem consumir cota de IA
- **Rotas de top-gainers/summary** podem retornar arrays vazios nos primeiros dias (sem histórico de preços ainda)
- **Cobertura alvo**: 21/21 rotas backend + simulação dos 19 fluxos de usuário

---

*Relacionado: [[ADR-008 - Estrategia de Qualidade e Estabilidade]], [[Agent Tester]]*
