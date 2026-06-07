---
description: Connect your ChatData token and verify the workspace MCP config.
---

# Login

Use this command when ChatData needs a workspace token, MCP config, or domain check.

Do not ask the user to paste token JSON into Terminal. Send them to ChatData Settings and have them copy the full one-shot Claude setup prompt or the terminal setup command.

## Sequence

1. Try `chatdata_doctor`.
2. If the config is valid, report the connected domain and route to `/chatdata:status`.
3. If the token or config is missing or invalid, say:
   "Open https://getchatdata.com/app/settings, click Copy prompt, paste the whole prompt here, and let Claude run it. Do not paste raw JSON lines."
4. If the user provides a setup command, run it quietly. Do not print, summarize, or expose the token.
5. Re-run `chatdata_doctor`, then recommend `/chatdata:onboarding` and `/chatdata:start`.

Required output:

- connected domain or blocker
- MCP status
- next command
