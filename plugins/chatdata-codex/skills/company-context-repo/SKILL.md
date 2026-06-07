---
name: company-context-repo
description: Attach or enforce ChatData's MCP-backed shared workspace context from Codex.
---

# ChatData Company Context

Use this skill when the user mentions a company, team, shared context, data catalog replacement, WBR, or reusable analytics context.

ChatData makes data analysis multiplayer by default. Company work should use MCP-backed shared workspace context mapped from the user's verified email domain. Customer-owned GitHub context repos are an explicit fallback, not the managed default.

## Commands

Check current state:

```bash
python3 ../../bin/chatdata_state.py status
```

Attach from email domain:

```bash
python3 ../../bin/chatdata_state.py company-repo --email "<user@company.com>"
```

Create or record a customer-owned repo fallback only when explicitly approved:

```bash
python3 ../../bin/chatdata_state.py company-repo \
  --company "<Company>" \
  --domain "<company.com>" \
  --owner "<github-owner>" \
  --repo "ChatData-<Company>" \
  --path "<local path>" \
  --sync-mode "chatdata-managed"
```

Check GitHub/sync readiness:

```bash
python3 ../../bin/chatdata_state.py github --create-plan
```

## Rules

- If MCP context exists, use it without asking.
- If MCP is missing, stop company analysis and configure it from ChatData Settings.
- Do not put GitHub private keys inside the plugin.
- For magical customer UX, use ChatData-managed backend sync or a GitHub App server-side.
- Do not run repo creation, push, invite, or access-grant commands without explicit approval.
