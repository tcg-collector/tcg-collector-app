---
name: resume
description: >
  Retoma uma sessão de feature em andamento. Carrega o contexto da última sessão,
  mostra o estado atual dos checkpoints e continua de onde parou.
  Use quando o usuário disser "continua", "retoma", "onde paramos", "resume",
  ou ao iniciar uma nova sessão num projeto com feature em andamento.
---

# Resume — Retomada de Sessão Long-Running

## O que fazer

### Passo 1 — Encontrar sessão ativa

Leia os arquivos em `.claude/sessions/` e encontre o que tiver `status: executing` ou `status: planning`.

Se houver mais de uma sessão ativa, liste todas e pergunte qual retomar:
```
Sessões em andamento:
  1. filtros-colecao (executing — 3/6 checkpoints)
  2. historico-precos (planning — aguardando aprovação SDD)

Qual retomar?
```

Se não houver nenhuma, informe:
```
Nenhuma sessão ativa encontrada em .claude/sessions/
Use /feature "descrição" para iniciar uma nova.
```

### Passo 2 — Carregar e exibir contexto

Leia o arquivo da sessão e exiba um resumo de orientação:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SESSÃO RETOMADA: <nome da feature>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Objetivo: <objetivo da sessão>

  Progresso:
    ✅ PRD aprovado
    ✅ SDD aprovado
    ✅ Backend implementado
    ⬜ Frontend implementado   ← próximo passo
    ⬜ Testes passando
    ⬜ /ship executado

  Última decisão registrada:
    <contexto da última sessão>

  Documentos:
    PRD → docs/specs/PRDs/<slug>.md
    SDD → docs/specs/SDDs/<slug>.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pronto para continuar. O que quer fazer agora?
```

### Passo 3 — Continuar execução

Após exibir o contexto, aguarde instrução do usuário ou, se o próximo checkpoint for claro, proponha a próxima ação diretamente.

Ao completar qualquer checkpoint, **atualize imediatamente o arquivo de sessão** marcando o item como concluído e registrando o contexto relevante.

### Passo 4 — Encerrar sessão

Quando todos os checkpoints estiverem completos e o `/ship` executado, atualize o status para `done` e exiba:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ SESSÃO CONCLUÍDA: <nome da feature>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Todos os checkpoints completos.
  Sessão arquivada em .claude/sessions/<slug>.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

