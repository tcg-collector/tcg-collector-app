# 🃏 Projeto TCG — App para Colecionadores de Pokémon

> Documento de planejamento criado com Claude · Versão 1.1 · Maio 2026

---

## 1. Visão do Produto

Um app multiplataforma (web + mobile) para colecionadores de cartas físicas de Pokémon TCG. O objetivo é ser a ferramenta central que o colecionador usa para gerenciar sua coleção, acompanhar o valor do seu portfólio, descobrir cartas que faltam e conectar com outros colecionadores.

**Problema que resolve:** Hoje, colecionadores usam planilhas, apps genéricos ou múltiplas ferramentas fragmentadas para controlar o que têm. Nenhuma solução resolve isso de forma elegante, integrada e em português para o mercado brasileiro.

**Proposta de valor:** "Seu binder digital — saiba exatamente o que você tem, o quanto vale e o que falta."

---

## 2. O Time

| Pessoa | Perfil | Papel no projeto |
|--------|--------|-----------------|
| **Matheus** | iFood · tech-savvy, não dev | Product Owner · Visão de produto · Responsável pela direção |
| **André** | MongoDB · vendas + banco de dados | Database Architect · Modelagem de dados · Backend |
| **Tamires** | Growth · Produtividade | Growth & Marketing · Aquisição de usuários · Métricas |

---

## 3. Funcionalidades Principais (MVP)

### Fase 1 — MVP Core (coleção)
- [ ] Catálogo completo de cartas Pokémon (via API pública)
- [ ] Adicionar cartas à coleção (quantidade, condição, idioma)
- [ ] Ver valor estimado da coleção (integração com preços de mercado)
- [ ] Filtrar e buscar cartas na coleção

### Fase 2 — Engajamento
- [ ] Lista de desejos (wishlist)
- [ ] Alerta de preço (notificar quando carta baixar de preço)
- [ ] Estatísticas da coleção (cards por set, raridade, valor ao longo do tempo)
- [ ] Compartilhar coleção / perfil público
- [ ] **Avaliação de condição por IA** — ver seção 9

### Fase 3 — Comunidade
- [ ] Proposta de troca entre usuários
- [ ] Feed de colecionadores seguidos
- [ ] Avaliações manuais de condição (complementar à IA)

---

## 4. Stack Tecnológica Recomendada

### Por que essa stack?
Escolhida para maximizar o reuso de código (web + mobile com a mesma base), aproveitar o conhecimento do André em MongoDB, e permitir que um time pequeno entregue rápido.

```
Frontend (Web + Mobile)
└── React Native com Expo
    ├── Funciona no Android, iOS e Web com o mesmo código
    ├── Expo facilita muito o build e publicação nas lojas
    └── Enorme comunidade e documentação

Backend (API)
└── Node.js + Express (ou Fastify)
    ├── JavaScript em tudo → time aprende uma linguagem só
    └── Fácil de hospedar (Railway, Render, Fly.io — planos gratuitos)

Banco de Dados
└── MongoDB Atlas (cloud)
    ├── André já conhece e tem rede na MongoDB
    ├── Perfeito para dados semi-estruturados de cartas
    └── Plano gratuito generoso para começar

APIs Externas
├── PokéTCG API (pokemontcg.io) — dados e imagens de todas as cartas, GRÁTIS
└── TCGplayer API ou preços via web scraping — valores de mercado

Autenticação
└── Clerk ou Supabase Auth (simples de integrar, grátis para começar)

Hospedagem inicial (gratuita)
├── Frontend Web: Vercel
├── Backend: Railway ou Render
└── Imagens: Cloudinary (otimização automática)
```

---

## 5. Fases do Projeto

### 📍 Fase 0 — Fundação (2–3 semanas)
**Objetivo:** Todo o time alinhado, ambiente pronto, primeiras decisões tomadas.

- [ ] Definir nome e identidade visual básica do app
- [ ] Criar repositório no GitHub (organização com 3 membros)
- [ ] Configurar ambiente de desenvolvimento local (Node, Git, VS Code)
- [ ] Explorar e testar a PokéTCG API
- [ ] Modelar o banco de dados (MongoDB) — estrutura de usuário, carta, coleção
- [ ] Criar wireframes das telas principais (pode usar Figma free)
- [ ] Definir as 5 telas do MVP

**Entregável:** Repositório criado, API testada, modelo de dados definido, wireframes prontos.

---

### 🏗️ Fase 1 — MVP (6–10 semanas)
**Objetivo:** App funcionando com as funcionalidades core de coleção.

**Semanas 1–2: Estrutura base**
- [ ] Setup do projeto React Native + Expo
- [ ] Setup do backend Node.js + conexão MongoDB
- [ ] Autenticação (login/cadastro)
- [ ] Ingestão do catálogo de cartas da API

**Semanas 3–4: Coleção**
- [ ] Tela de busca de cartas
- [ ] Adicionar/remover carta da coleção
- [ ] Ver minha coleção (listagem + filtros)

**Semanas 5–6: Valor**
- [ ] Integrar preços de mercado
- [ ] Dashboard com valor total da coleção
- [ ] Detalhe da carta (preço histórico, variações)

**Semanas 7–8: Polimento**
- [ ] Testes com usuários reais (amigos colecionadores)
- [ ] Correção de bugs
- [ ] Melhorias de UX baseadas no feedback

**Entregável:** App instalável via Expo Go, funcional para uso interno.

---

### 🚀 Fase 2 — Publicação (2–4 semanas)
**Objetivo:** App disponível na Play Store e App Store.

- [ ] Criar conta de desenvolvedor Google Play ($25 taxa única)
- [ ] Criar conta Apple Developer ($99/ano) — pode atrasar se foco for Android
- [ ] Configurar build de produção com EAS Build (Expo)
- [ ] Criar screenshots, descrição e ícone do app
- [ ] Submeter para review nas lojas
- [ ] Lançar versão beta (acesso restrito) antes do público

**Entregável:** App publicado na Play Store.

---

### 📈 Fase 3 — Crescimento (contínuo)
**Objetivo:** Adquirir usuários e iterar com base em dados.

- [ ] Estratégia de aquisição orgânica (Tamires lidera)
  - Comunidades de Pokémon no Reddit, Discord, grupos de WhatsApp
  - Conteúdo no Instagram/TikTok mostrando o app em uso
- [ ] Integrar analytics (Mixpanel ou Amplitude — plano free)
- [ ] Funil de ativação: cadastro → primeira carta adicionada → coleção com 10+ cartas
- [ ] Coletar feedback ativo dos primeiros 100 usuários
- [ ] Roadmap das Fases 2 e 3 de features

---

## 6. Decisões Importantes Antes de Codar

Antes de escrever a primeira linha de código, o time precisa alinhar:

1. **Nome do app** — Tem identidade visual? Domínio disponível?
2. **Modelo de negócio** — Free? Freemium? O que será pago no futuro?
3. **Foco geográfico inicial** — Brasil? Global? (Impacta idioma e moeda nos preços)
4. **Condição das cartas** — Como vocês vão classificar? (Near Mint, Lightly Played, etc.)
5. **Diferencial competitivo** — O que faz esse app melhor que Cardmarket, TCGplayer app, PokePortfolio?

---

## 9. Feature: Avaliação de Condição por IA 📸

> **Fase 2** — não é MVP, mas é um diferencial importante do produto. A arquitetura já suporta (campo `condition` em UserCollection).

### O que é

O usuário abre a câmera do celular (ou upload no navegador), tira uma foto da carta — frente e verso — e a IA sugere automaticamente a condição da carta (NM, LP, MP, HP ou DMG) com base na análise visual. O valor exibido da carta é atualizado de acordo com a condição sugerida.

### Escala de condições suportada

| Código | Nome | Descrição |
|--------|------|-----------|
| NM | Near Mint | Praticamente perfeita, sem marcas visíveis |
| LP | Lightly Played | Desgaste mínimo nas bordas |
| MP | Moderately Played | Marcas visíveis, ainda jogável |
| HP | Heavily Played | Danos significativos |
| DMG | Damaged | Muito danificada, dobrada ou rasgada |

### Comportamento esperado

**Foto individual (1 carta):**
- IA analisa frente e verso
- Retorna condição sugerida + justificativa (ex