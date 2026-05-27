# Pipeline de Qualidade de Código

## Componentes

| Workflow | Gatilho | O que faz |
|----------|---------|-----------|
| `ci.yml` | Push/PR para `main` | Typecheck + ESLint + Jest no backend e frontend |
| `claude-review.yml` | PR aberto/atualizado | Revisa o diff com Claude Haiku e posta comentário |

## Setup necessário (uma vez)

### 1. Adicionar secrets no GitHub

Vá em: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `ANTHROPIC_API_KEY` | Sua chave da API Anthropic (`sk-ant-...`) |

> O `GITHUB_TOKEN` é injetado automaticamente pelo GitHub Actions — não precisa configurar.

### 2. Instalar dependências locais

```bash
# Backend
cd backend
npm install

# Frontend
cd app
npm install --legacy-peer-deps
```

### 3. Rodar localmente antes de fazer PR

```bash
# Backend
cd backend
npm run typecheck
npm run lint
npm test

# Frontend
cd app
npm run typecheck
npm run lint
npm test
```

## Como funciona o agente Claude

1. Quando você abre ou atualiza um PR, o workflow detecta arquivos `.ts`/`.tsx` alterados
2. Gera um diff dos arquivos TypeScript modificados
3. Envia o diff para o Claude Haiku via API
4. Claude analisa: bugs, segurança, performance, qualidade
5. O resultado é postado automaticamente como comentário no PR

## Adicionando novos testes

- **Backend**: criar arquivos em `backend/src/__tests__/*.test.ts`
- **Frontend**: criar arquivos em `app/__tests__/*.test.ts` ou `app/__tests__/*.test.tsx`
