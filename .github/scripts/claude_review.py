#!/usr/bin/env python3
"""
Agente de code review automático usando Claude.
Lê o diff do PR, chama a API do Claude e posta um comentário no PR.
"""
import json
import os
import urllib.request
import urllib.error
import subprocess
import sys

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
GH_TOKEN = os.environ["GH_TOKEN"]
PR_NUMBER = os.environ["PR_NUMBER"]
REPO = os.environ.get("GITHUB_REPOSITORY", "")
MAX_DIFF_CHARS = 12_000

REVIEW_PROMPT = """Você é um engenheiro sênior revisando um Pull Request de um app React Native + Expo + Node.js/Express + TypeScript chamado TCG Bindex.

Analise o diff abaixo e produza uma revisão objetiva e direta. Foque em:
- 🐛 **Bugs**: erros que vão quebrar em runtime
- 🔒 **Segurança**: inputs não validados, dados expostos, auth bypassada
- ⚡ **Performance**: queries N+1, loops desnecessários, re-renders
- 🧹 **Qualidade**: código duplicado, tratamento de erro ausente, typing fraco
- ✅ **Boas práticas**: o que foi bem feito neste diff

Regras de formato:
- Use seções com emoji como cabeçalho
- Cite o arquivo e linha quando relevante (ex: `backend/src/routes/binders.ts:42`)
- Se uma seção não tiver nada a reportar, omita ela completamente
- Seja direto — sem introdução, sem conclusão genérica
- Máximo 600 palavras

Diff:
```
{diff}
```
"""

def call_claude(diff: str) -> str:
    payload = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": REVIEW_PROMPT.format(diff=diff)}],
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
            return data["content"][0]["text"]
    except urllib.error.HTTPError as e:
        print(f"Erro na API do Claude: {e.code} {e.read().decode()}", file=sys.stderr)
        sys.exit(1)

def post_pr_comment(body: str) -> None:
    url = f"https://api.github.com/repos/{REPO}/issues/{PR_NUMBER}/comments"
    payload = {"body": body}
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {GH_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"Comentário postado: {resp.status}")
    except urllib.error.HTTPError as e:
        print(f"Erro ao postar comentário: {e.code} {e.read().decode()}", file=sys.stderr)
        sys.exit(1)

def main():
    # Lê o diff gerado pelo step anterior
    try:
        with open("diff.txt", "r", encoding="utf-8", errors="replace") as f:
            diff = f.read(MAX_DIFF_CHARS)
    except FileNotFoundError:
        print("diff.txt não encontrado", file=sys.stderr)
        sys.exit(1)

    if not diff.strip():
        print("Diff vazio — nada a revisar.")
        return

    print(f"Diff com {len(diff)} caracteres — chamando Claude...")
    review = call_claude(diff)

    comment = (
        "## 🤖 Claude Code Review\n\n"
        f"{review}\n\n"
        "---\n"
        "*Revisão automática por [Claude Haiku](https://anthropic.com) · "
        "Ignore se o contexto não for relevante para este PR.*"
    )

    post_pr_comment(comment)
    print("✅ Review postado com sucesso.")

if __name__ == "__main__":
    main()
