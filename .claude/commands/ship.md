---
name: ship
description: >
  Deploy estruturado para o projeto TCG Bindex: commit + push para develop,
  aguarda CI do GitHub Actions, cria PR develop→main, aguarda CI do PR e faz merge.
  Use sempre que o usuário quiser subir código, fazer deploy, publicar mudanças,
  ou mencionar "ship", "subir", "publicar", "deploy", "push pra main" ou "mandar pra produção".
---

# Ship — Deploy Estruturado TCG Bindex

Fluxo completo de deploy: develop → CI → PR → main.

## Como usar

```
/ship "mensagem do commit"
```

Se não houver argumento, peça a mensagem de commit ao usuário antes de prosseguir.

## Fluxo de execução

Execute cada etapa em sequência, exibindo o status visualmente após cada uma.

### Etapa 1 — Commit

```bash
git add -A
git commit -m "<mensagem>"
```

Se não houver nada para commitar (working tree limpa), pule para a Etapa 2.

### Etapa 2 — Push para develop

Mude para a branch develop e integre as mudanças:

```bash
git checkout develop
git merge main --no-edit   # garante que develop está atualizado antes
git cherry-pick <commit-hash>  # ou git merge <branch-origem> se vier de outra branch
git push origin develop
```

> Se já estiver na branch develop com as mudanças, apenas: `git push origin develop`

### Etapa 3 — Aguardar CI no develop

```bash
gh run list --branch develop --limit 1 --json databaseId,status,conclusion,url
```

Faça polling a cada 15 segundos até `status == "completed"`. Mostre progresso:

```
⏳ CI rodando em develop... (15s)
⏳ CI rodando em develop... (30s)
```

Se `conclusion == "failure"`:
- Exiba ❌ CI FALHOU
- Busque o log de erro: `gh run view <id> --log-failed`
- Mostre o trecho relevante do log
- **Pare o fluxo** e informe o usuário

### Etapa 4 — Criar PR develop → main

```bash
gh pr create \
  --base main \
  --head develop \
  --title "<mensagem do commit>" \
  --body "Deploy automático via /ship"
```

Capture o número do PR criado.

### Etapa 5 — Aguardar CI do PR

```bash
gh pr checks <numero-pr> --watch
```

Ou polling manual:
```bash
gh pr view <numero-pr> --json statusCheckRollup
```

Aguarde até todos os checks passarem. Se algum falhar, mostre o log e pare.

### Etapa 6 — Merge do PR

```bash
gh pr merge <numero-pr> --squash --delete-branch=false
```

Use `--squash` para manter o histórico da main limpo.

### Etapa 7 — Atualizar BACKLOG (se aplicável)

Após o merge, leia `.claude/backlog.md` e verifique se há itens em `🔵 Em sprint` relacionados a este PR.

- Se houver: mova-os para `✅ Entregue` com a data de hoje e o número do PR
- Se não houver (deploy de infra, docs, agents, chore): pule esta etapa sem modificar o BACKLOG

Salve o BACKLOG.md atualizado com `Write` antes de exibir o resumo.

---

### Etapa 8 — Resumo final

Exiba um sumário visual completo:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 SHIP CONCLUÍDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Commit: feat: nova funcionalidade
  ✅ Push → develop
  ✅ CI develop: passou (1m 42s)
  ✅ PR #12 criado
  ✅ CI PR: passou (1m 38s)
  ✅ Merge → main

  🔗 PR: https://github.com/tcg-collector/tcg-collector-app/pull/12
  🔗 CI: https://github.com/tcg-collector/tcg-collector-app/actions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Em caso de falha

Se qualquer etapa falhar, exiba imediatamente:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ❌ SHIP PARADO — CI falhou em develop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Commit: feat: nova funcionalidade
  ✅ Push → develop
  ❌ CI develop: FALHOU

  📋 Erro:
  <log de erro relevante aqui>

  🔗 Ver run completo: <url do run>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Não prossiga para as próximas etapas. Deixe o usuário corrigir e rodar `/ship` novamente.

## Notas

- O projeto usa `gh` (GitHub CLI) autenticado com o remote `origin`
- Remote: `https://github.com/tcg-collector/tcg-collector-app.git`
- CI definido em `.github/workflows/ci.yml` — roda em push para `main` e `develop`
- Timeout recomendado para CI: 10 minutos antes de alertar o usuário

