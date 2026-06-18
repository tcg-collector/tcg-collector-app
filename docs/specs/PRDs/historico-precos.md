# PRD — Histórico de Preços das Cartas

**Status:** Draft  
**Data:** 2026-06-16  
**Fase do produto:** Fase 3

---

## Problema

O app hoje mostra o preço atual de cada carta, mas não tem memória de preços passados. Isso impede qualquer análise de tendência: o colecionador não sabe se uma carta valorizou, desvalorizou ou estabilizou. Cartas que a API retorna sem preço aparecem como "sem valor" mesmo quando tinham valor ontem. Sem histórico, é impossível construir carrosséis de maiores valorizações, indicadores de variação na coleção ou alertas de preço.

## Solução

Criar uma camada de histórico de preços no backend:

- O cron diário de sync (06:00 UTC) passa a salvar um snapshot de preço por carta por dia, além de atualizar o preço atual
- Quando a API PokéTCG retorna `null` para uma carta, o sistema persiste o último valor conhecido em vez de zerar
- Retenção de 60 dias — snapshots mais antigos são deletados automaticamente
- Cinco novos endpoints expõem os dados históricos, separados por domínio:
  - **`GET /api/prices/top-gainers?days=7&limit=10`** — catálogo global, maior % crescimento (home)
  - **`GET /api/prices/top-value?limit=10`** — catálogo global, maior valor absoluto atual (home)
  - **`GET /api/collections/top-gainers?days=7&limit=10`** — mesma lógica, filtrado pela coleção do usuário
  - **`GET /api/collections/top-value?limit=10`** — top cartas mais caras da coleção do usuário
  - **`GET /api/collections/summary`** — `{ totalValueUSD, deltaUSD, deltaPct }` nos últimos 7 dias
- O parâmetro `days` aceita apenas `[7, 30, 60]` — validado no backend, retorna 400 para outros valores
- Internamente, um único helper `calcGainers(cardIds[], days)` serve os dois top-gainers — sem duplicação de lógica

## Usuário-alvo

Todo colecionador que usa o app para acompanhar o valor da coleção — do iniciante que quer saber "minha carta valorizou?" ao avançado que monitora o mercado para comprar e vender no momento certo.

## Critérios de aceite

- [ ] Cron diário salva snapshot `{ cardId, date, prices }` para cada carta sincronizada
- [ ] Carta com preço `null` na API mantém o último preço conhecido no campo `prices` do Card
- [ ] Snapshots com mais de 60 dias são deletados automaticamente (limpeza no próprio cron)
- [ ] `GET /api/prices/top-gainers?days=N&limit=10` retorna top cartas globais por % crescimento — exclui cartas sem snapshot em D-N e cartas que saíram de zero
- [ ] `GET /api/prices/top-value?limit=10` retorna top cartas globais por valor absoluto atual — exclui cartas sem preço
- [ ] `GET /api/collections/top-gainers?days=N&limit=10` retorna mesma lógica filtrada pelos cardIds do usuário autenticado
- [ ] `GET /api/collections/top-value?limit=10` retorna top cartas mais caras da coleção do usuário
- [ ] `GET /api/collections/summary` retorna `{ totalValueUSD, deltaUSD, deltaPct, days: 7 }`
- [ ] Parâmetro `days` aceita apenas `[7, 30, 60]` — retorna HTTP 400 para outros valores
- [ ] Todos os 5 endpoints requerem autenticação
- [ ] Testes de integração cobrindo os 5 endpoints e a lógica de persistência de último preço

## Fora do escopo

- Frontend (carrosséis e indicadores vêm nas features [2] e [3])
- Histórico além de 60 dias
- Alertas de preço em tempo real (Fase 3 futura)
- Histórico por condição de carta (usa sempre o preço `market` base)
- Granularidade intraday (apenas um snapshot por dia)

## Impacto esperado

Habilita todas as features de inteligência de valor planejadas: carrosséis de mercado na home, variação da coleção em BRL e %, top cartas valorizadas. Também melhora a qualidade do dado atual — cartas que a API não retorna preço param de aparecer como "sem valor" para o usuário.

## Dependências

- Cron de sync de preços já existe em Railway (06:00 UTC diário) — será estendido, não substituído
- MongoDB Atlas M0 (free): estimativa de volume — ~12.000 cartas × 60 dias × ~200 bytes por doc = ~144 MB. Dentro do limite de 512 MB do M0.
