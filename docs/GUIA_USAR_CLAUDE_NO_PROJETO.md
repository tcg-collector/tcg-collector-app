# Guia: Como Usar o Claude no Projeto TCG

> Para Matheus, André e Tamires — o Claude como quarto membro do time

---

## Por que o Claude muda o jogo para um time não-dev

Vocês três têm conhecimento profundo de produto, banco de dados e growth — mas ninguém tem experiência em escrever código mobile do zero. O Claude preenche exatamente essa lacuna: ele funciona como um engenheiro sênior disponível 24h que:

- Escreve código funcional que você copia direto no projeto
- Explica cada decisão técnica em linguagem simples
- Revisa erros e sugere correções
- Nunca julga perguntas "básicas"

A chave é saber **como pedir**. Prompts vagos → respostas genéricas. Prompts detalhados → código que funciona na primeira vez.

---

## Os 5 princípios de um bom prompt

### 1. Dê contexto sempre
❌ "Como faço uma tela de busca?"
✅ "Estou construindo um app React Native com Expo para colecionadores de Pokémon. Preciso de uma tela de busca que consulta a PokéTCG API e exibe os resultados em grade com a imagem da carta, nome e número do set."

### 2. Especifique a stack
Sempre mencione: React Native, Expo, Node.js, MongoDB. Assim o Claude não sugere soluções incompatíveis.

### 3. Mostre o que você já tem
Cole o código existente quando pedir ajuda. O Claude vai adaptar a solução ao que já está pronto.

### 4. Diga o que você quer de volta
"Me dê só o código, sem explicação" ou "Explica cada parte linha por linha" ou "Me dá um exemplo simples primeiro, depois o completo."

### 5. Itere no mesmo chat
Continue pedindo ajustes na mesma conversa: "Agora adiciona paginação" / "Muda pra exibir em lista em vez de grade" / "Como trato o erro quando a API cai?"

---

## Prompts por fase do projeto

### FASE 0 — Fundação

**Explorar a API de cartas:**
```
Quero explorar a PokéTCG API (pokemontcg.io). Me mostra como fazer:
1. Uma chamada para buscar cartas pelo nome usando Node.js e fetch
2. Como filtrar por set (ex: só cartas do set "Scarlet & Violet")
3. Quais campos de preço estão disponíveis na resposta

Me dá o código comentado e um exemplo de resposta JSON que posso esperar.
```

**Modelar o banco de dados:**
```
Estou modelando o banco MongoDB para um app de coleção de cartas Pokémon.
Os usuários podem:
- Adicionar cartas à coleção (com quantidade, condição: NM/LP/MP, idioma: PT/EN/JP)
- Criar listas de desejo
- Ver o valor total estimado da coleção

Me sugere os schemas do Mongoose para: User, Card (espelho da API), UserCollection.
Explica as decisões de modelagem (embedded vs referência).
```

**Criar o repositório com estrutura base:**
```
Me ajuda a criar a estrutura de pastas para um monorepo com:
- /apps/mobile (React Native + Expo)
- /apps/web (React + Vite)
- /backend (Node.js + Express)
- /packages/shared (tipos TypeScript compartilhados)

Me dá o comando pnpm para criar isso e o package.json raiz.
```

---

### FASE 1 — Desenvolvimento

**Tela de busca de cartas:**
```
Cria uma tela de busca de cartas em React Native (Expo) que:
- Tem um campo de texto no topo
- Enquanto o usuário digita, faz debounce de 500ms e chama a PokéTCG API
- Exibe resultados em FlatList com: imagem da carta, nome, número, set
- Mostra um loading spinner durante a busca
- Trata o caso de resultado vazio com uma mensagem

Usa TypeScript. Já tenho o Expo SDK 51 instalado.
```

**Rota backend para adicionar carta à coleção:**
```
Cria uma rota POST /api/collection em Express que:
- Recebe no body: { cardId, quantity, condition, language }
- Autentica via JWT (já tenho o middleware auth.ts)
- Verifica se a carta já existe na coleção do usuário
  - Se sim: atualiza a quantidade
  - Se não: cria novo documento
- Usa o modelo UserCollection do Mongoose

Me dá também o tipo TypeScript para o body da requisição.
```

**Tratar erros comuns:**
```
No meu app React Native estou recebendo esse erro:
[COLE O ERRO AQUI]

O código onde acontece é esse:
[COLE O CÓDIGO AQUI]

O que está causando e como corrijo?
```

---

### FASE 2 — Publicação

**Checklist para Play Store:**
```
Vou publicar meu app React Native (Expo) na Google Play Store pela primeira vez.
Me dá um checklist completo de:
1. O que configurar no app.json do Expo antes do build
2. Assets necessários (ícone, splash, screenshots — tamanhos exatos)
3. Como fazer o build com EAS Build
4. O que preencher no Google Play Console
5. Erros comuns de rejeição e como evitar
```

**Descrever o app para a loja:**
```
Preciso escrever a descrição do meu app para a Play Store.
App: coleção de cartas Pokémon físicas. Funcionalidades: catalogar cartas, ver valor estimado, lista de desejos.
Público: colecionadores brasileiros.

Escreve:
- Título (máx 50 caracteres)
- Descrição curta (máx 80 caracteres)  
- Descrição longa (máx 4000 caracteres) com as funcionalidades em destaque
- 5 palavras-chave relevantes para ASO (otimização nas buscas da loja)
```

---

### FASE 3 — Crescimento (Tamires)

**Definir métricas de sucesso:**
```
Sou responsável pelo growth de um app de coleção de Pokémon TCG.
Me ajuda a definir:
1. As 3 métricas principais do funil (do download até o usuário ativo)
2. Como configurar eventos no Mixpanel para rastrear essas métricas
3. Quais são os eventos mais críticos para rastrear nos primeiros 7 dias após o download
```

**Criar estratégia de lançamento:**
```
Vou lançar um app de coleção de Pokémon no Brasil. Budget zero para marketing.
Me cria um plano de lançamento para os primeiros 30 dias focado em:
- Comunidades online (Reddit, Discord, grupos Pokémon Brasil)
- Criadores de conteúdo de nicho (YouTubers de unboxing Pokémon)
- SEO/ASO nas lojas

Inclui calendário semanal e templates de mensagem para abordar comunidades.
```

---

## Dicas especiais para o Matheus (Product Owner)

Como você vai coordenar o time e tomar decisões de produto, seus melhores usos do Claude são:

**Para reuniões de alinhamento:**
```
Preciso apresentar para o meu time as decisões de produto para o nosso app TCG.
Cria um documento de PRD (Product Requirements Document) de 1 página com:
- Problema que resolvemos
- Usuário-alvo
- Top 5 funcionalidades do MVP com critérios de aceite
- O que NÃO está no MVP
```

**Para validar ideias rapidamente:**
```
Tenho a ideia de adicionar [FUNCIONALIDADE] no nosso app.
Me dá uma análise rápida:
- Complexidade de implementação (baixa/média/alta) e por quê
- Impacto esperado para o usuário
- Riscos ou armadilhas
- Se eu fosse priorizar agora, deveria entrar no MVP ou deixar pra depois?
```

**Para resolver conflitos de direção:**
```
Eu e meu cofundador estamos em dúvida entre duas abordagens:
Opção A: [descreva]
Opção B: [descreva]

Contexto do projeto: [descreva o app]

Me dá um comparativo objetivo das duas opções com prós, contras e qual você escolheria e por quê.
```

---

## Dicas especiais para o André (Database)

**Para modelagem avançada:**
```
No MongoDB, estou modelando dados de cartas Pokémon onde:
- Cada carta tem múltiplos preços (Normal, Holofoil, Reverse Holofoil)
- Os preços mudam diariamente
- Preciso consultar o histórico de preço de uma carta específica

Qual é a melhor estratégia: guardar histórico em array embedded, coleção separada com time-series, ou outra abordagem? Mostra a modelagem e as queries principais.
```

---

## Erros a evitar

| Não faça | Faça assim |
|----------|-----------|
| "Me faz um app de TCG" | Pede por partes: uma tela, uma rota, uma função de cada vez |
| Copiar código sem entender | Peça: "Explica o que cada parte faz" antes de usar |
| Abandonar quando o erro aparece | Cole o erro exato no chat — o Claude resolve na hora |
| Pedir revisão sem contexto | "Revisa esse código que faz X para Y usuários em Z situação" |

---

## Como organizar as conversas do Claude

- **Uma conversa por funcionalidade** — não misture temas diferentes
- **Salve os prompts que funcionaram** — crie um arquivo `prompts_uteis.md` no repo
- **Use o Cowork** para documentos, planejamento e revisões
- **Use o Claude Code** (se quiser) direto no VS Code para edição de código em tempo real

---

*Atualizar esse guia conforme vocês descobrirem novas formas de usar o Claude no projeto.*
