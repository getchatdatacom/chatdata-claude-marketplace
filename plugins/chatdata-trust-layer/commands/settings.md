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

- Copy prompt: install or repair Claude Code end to end
- Copy terminal setup command: repair only `~/.chatdata/config.json`
- Review consent: grant or revoke metadata sync permission
- Log in again: refresh the browser session after switching workspaces

End with `/chatdata:status` and `/chatdata:start`.
