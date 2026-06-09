---
description: Open the ChatData settings path for token, MCP, consent, and install repair.
---

# Settings

Use this command when the user needs setup, token, consent, MCP install, or workspace repair.

First run `chatdata_doctor` if available. If a repair is needed, send the user to:

```text
https://getchatdata.com/app/settings
```

Then tell them which action to use:

- Copy prompt: install or repair ChatData with surface detection first. Claude Code gets the plugin plus MCP path; Codex gets the MCP-only path.
- Copy terminal setup command: repair only `~/.chatdata/config.json`
- Review consent: grant or revoke metadata sync permission
- Log in again: refresh the browser session after switching workspaces

In Claude Code, end with `/chatdata:status` and `/chatdata:start`. For Codex setup, reconnect Codex and run ChatData MCP tools directly.
