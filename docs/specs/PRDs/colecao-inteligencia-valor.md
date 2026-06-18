# PRD — Coleção com Inteligência de Valor

**Status:** Draft  
**Data:** 2026-06-16  
**Fase do produto:** Fase 2

---

## Problema

A tela de Coleção hoje mostra apenas uma lista de cartas avulsas e uma lista de binders. O colecionador não tem nenhuma visão consolidada do valor da sua coleção: não sabe quanto vale no total, se valorizou ou desvalorizou na semana, quais são suas cartas mais valiosas nem quais tiveram maior alta. São informações que exigem calcular manualmente — ou simplesmente ficam invisíveis.

## Solução

Adicionar um painel de inteligência no topo da tela de Coleção, acima da lista avulsa existente, com três blocos:

1. **Resumo de Valor** — card compacto mostrando o valor total da coleção em USD e BRL, mais o delta dos últimos 7 dias em valor absoluto e percentual (ex: "+R$ 42,00 · +8,3%"). Consome `GET /api/collections/summary?days=7`.

2. **Maiores Valorizações** — carrossel horizontal com até 5 cartas da coleção do usuário com maior % de crescimento nos últimos 7 dias, com badge `+X%`. Consome `GET /api/collections/top-gainers?days=7&limit=5`.

3. **Mais Valiosas da Coleção** — carrossel horizontal (mesmo padrão visual da Home) com até 5 cartas mais caras da coleção, mostrando imagem, nome, edição e preço em BRL. Consome `GET /api/collections/top-value?limit=5`.

A lista avulsa e os binders existentes permanecem inalterados abaixo do painel.

## Usuário-alvo

Colecionador ativo que já tem cartas cadastradas e quer entender o valor e tendência da sua coleção de forma imediata, sem precisar calcular manualmente ou sair da tela.

## Critérios de aceite

- [ ] Card de Resumo de Valor exibe `totalValueUSD` convertido em BRL e o delta (+/- em BRL e %)
- [ ] Delta positivo exibido em verde (Colors.mint), negativo em vermelho (Colors.crimson)
- [ ] Quando `summary` retorna `deltaUSD === 0` (sem histórico ainda), exibe "—" no lugar do delta
- [ ] Carrossel "Maiores Valorizações" exibe até 5 cartas com badge `+X%` em verde
- [ ] Carrossel "Mais Valiosas" exibe até 5 cartas com imagem, nome, edição e preço em BRL (mesmo padrão visual da Home)
- [ ] Estado vazio por bloco: quando endpoint retorna lista vazia, bloco não aparece (não exibe mensagem de erro)
- [ ] Loading skeleton no painel inteiro enquanto os três fetches completam
- [ ] Toque em carta do carrossel ou da lista navega para `app/card/[id]`
- [ ] Painel aparece apenas quando o usuário tem pelo menos 1 carta na coleção
- [ ] Lista avulsa e binders existentes continuam funcionando normalmente

## Fora do escopo

- Filtro de período (sempre D-7 fixo nesta entrega)
- Seção de edições presentes na coleção
- Histórico de valor em gráfico
- Cartas dos binders no cálculo (apenas coleção avulsa)
- Alterações de backend

## Impacto esperado

A tela de Coleção passa de uma lista passiva para um painel de gestão de patrimônio. O colecionador tem resposta imediata para "quanto vale minha coleção?" e "o que mais subiu essa semana?" sem precisar abrir cada carta individualmente.

## Dependências

- Feature "Histórico de Preços" (entregue) — endpoints `/api/collections/top-gainers`, `/api/collections/top-value` e `/api/collections/summary` já existem em produção
- Cotação USD→BRL via `/api/prices/exchange` (já existe)
