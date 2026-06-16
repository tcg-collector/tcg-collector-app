# Pipeline de Qualidade de Código

## Visão geral

Todo código passa por 3 camadas automáticas antes de chegar em produção:

```
feature/fix branch
      ↓
   PR → develop    ← CI roda aqui (typecheck + lint + tests)
      |             ← Claude review posta comentário automático
      ↓
   PR → main       ← CI roda de novo (segunda barreira)
      ↓
  produção (Railway + Vercel via deploy automático)
```

## Workflows

| Workflow | Gatilho | O que faz |
|----------|---------|-----------|
| `ci.yml` | Push/PR para `main` ou `develop` | Typecheck + ESLint + Jest no backend e frontend |
| `claude-review.yml` | PR aberto/atualizado em `main` ou `develop` | Revisa o diff com Claude e posta comentário |
| `health-check.yml` | Todo dia às 08:00 BRT | Verifica se backend e frontend estão respondendo |

## O que bloqueia o merge

Um PR **não pode ser mergeado** se qualquer um dos checks falhar:
- ❌ TypeScript com erro de tipo (`tsc --noEmit`)
- ❌ ESLint com erro
- ❌ Algum teste quebrando (`jest`)

O Claude review **não bloqueia** — é informativo. Mas leia antes de mergear.

## Setup necessário (uma vez por repositório)

### Secrets no GitHub

Vá em: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor | Obrigatório para |
|--------|-------|-----------------|
| `ANTHROPIC_API_KEY` | Chave `sk-ant-...` | Claude review automático |

> `GITHUB_TOKEN` é injetado automaticamente — não precisa configurar.

### Branch protection rules (recomendado)

Vá em: **GitHub → Settings → Branches → Add rule**

Para `main` e `develop`:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Adicione: `Backend — typecheck + lint + tests`
  - Adicione: `Frontend — typecheck + lint + tests`
- ✅ Require branches to be up to date before merging

## Como rodar localmente antes de fazer PR

```bash
# Backend
cd backend
npm run typecheck   # zero erros de tipo
npm run lint        # zero warnings
npm test            # todos os testes passando

# Frontend
cd app
npm run typecheck
npm run lint
npm test
```

## Adicionando novos testes

- **Backend**: `backend/src/__tests__/*.test.ts`
- **Frontend**: `app/__tests__/*.test.ts` ou `*.test.tsx`

Qualquer arquivo `*.test.ts` na pasta `__tests__` é detectado automaticamente pelo Jest.

## Estrutura de branches

| Branch | Propósito | Deploy |
|--------|-----------|--------|
| `main` | Produção | Railway + Vercel (automático) |
| `develop` | Staging / integração | — |
| `feature/xxx` | Nova funcionalidade | — |
| `fix/xxx` | Correção de bug | — |
| `hotfix/xxx` | Bug urgente em produção | direto para `main` + cherry-pick em `develop` |

## Rollback de emergência

```bash
# Ver histórico de tags/versões
git log --oneline main

# Fazer rollback para um commit anterior
git checkout main
git revert <commit-hash>   # cria commit de reversão (seguro)
git push origin main       # dispara novo deploy

# OU: forçar para commit anterior (destrutivo — use com cautela)
git reset --hard <commit-hash>
git push --force-with-lease origin main
```
