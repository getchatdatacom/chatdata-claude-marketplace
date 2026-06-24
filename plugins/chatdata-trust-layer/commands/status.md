---
description: Check ChatData MCP, workspace, context sync, and review-queue status.
---

# Status

Use this command immediately after install, activation, or a suspected context-sync failure.

Keep the output compact. This command should answer "is MCP connected, is approved context available, and what should I do next?" It should not list every file.

First use the ChatData MCP server and run `chatdata_doctor`.

- If the tool is unavailable, stop and say: "ChatData MCP is not connected. Install or repair the MCP from ChatData Settings, restart Claude Code, then rerun `/chatdata:status`."
- If `chatdata_doctor` reports config, consent, token, workspace, or hub errors, stop and show the exact failing check plus the next install or repair action.
- If `chatdata_doctor` does not report `read_only: false` and `required_write_tools_present: true`, say the session is using a stale ChatData MCP tool cache or old package. Tell the user to restart or reconnect Claude Code, then rerun `/chatdata:status`.
- If the connected domain is not the intended customer workspace, stop and have the user copy the terminal setup command from the correct ChatData workspace before any analysis or sync.
- If healthy, continue.

Then use the ChatData MCP server and run `chatdata_pull_context`.

- If pull succeeds, report the workspace, domain, current revision, local cache path, and freshness.
- Treat `pulled_count` as the number of changed files in the latest incremental pull only. Use `file_count`, `cached_count`, `context_available`, and `empty_workspace` to decide whether context exists.
- If pull fails but `chatdata_doctor` is healthy, report the pull error, whether cached context is still available, and the next retry or hub repair action.

Then use the ChatData MCP server and run `chatdata_list_review_queue`.

- Report the count of pending patches and at most the top 3 pending paths.
- If the queue cannot be read, say context status is incomplete and show the queue error.

Then read the installed plugin manifest version when local shell access is available:

```bash
python3 - <<'PY'
import json, os, pathlib
root = pathlib.Path(os.environ.get("CLAUDE_PLUGIN_ROOT", "."))
path = root / ".claude-plugin" / "plugin.json"
if path.exists():
    data = json.loads(path.read_text())
    print(data.get("version", "unknown"))
else:
    print("unknown")
PY
```

If the plugin version is unknown, the command map looks stale, or the user expected a command that is missing, route to `/chatdata:update`. Do not claim the update is applied until the user runs `/reload-plugins` or restarts Claude Code.

Required output:

- MCP doctor status
- installed plugin version if readable
- workspace and domain
- context pull status
- local cache path or missing-cache reason
- pending review count
- update path if needed: `/chatdata:update`
- next command: `/chatdata:audit-context`, `/chatdata:sync-context`, `/chatdata:publish-patch`, or `/chatdata:update`
