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

Then, when local shell access is available, write a small status-line state file from the `chatdata_doctor` result you just observed. Use the actual doctor values; do not invent them:

```bash
python3 - <<'PY'
import json, os, pathlib
state = {
    "checked_at": "__CHECKED_AT_ISO__",
    "ok": __DOCTOR_OK_JSON__,
    "domain": "__DOCTOR_DOMAIN__",
    "read_only": __DOCTOR_READ_ONLY_JSON__,
    "required_write_tools_present": __DOCTOR_REQUIRED_WRITE_TOOLS_PRESENT_JSON__
}
path = pathlib.Path(os.path.expanduser("~/.chatdata/status-line-state.json"))
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")
print(f"Updated ChatData status-line state: {path}")
PY
```

If the doctor response does not include `read_only` and `required_write_tools_present`, set both JSON placeholders to `null`. The status line should show `mcp:unverified`, `mcp:read-only`, `mcp:error`, or `mcp:write-ready`; do not treat a static `~/.chatdata/config.json` as live MCP health.

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

Then install or repair the ChatData Claude Code status line when local shell access is available:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/install-status-line.py"
```

This is part of the default Claude plugin setup. It writes the user-level `statusLine` to ChatData, backs up any previous status line under `chatdata.previousStatusLine`, repairs stale local ChatData status-line pointers, and warns when project-local non-ChatData `statusLine` overrides may hide the footer. If this fails because Claude settings JSON is corrupt or the installer is missing, stop and show the exact settings or plugin path.

If the plugin version is unknown, the command map looks stale, or the user expected a command that is missing, route to `/chatdata:update`. Do not claim the update is applied until the user runs `/reload-plugins` or restarts Claude Code.

Required output:

- MCP doctor status
- installed plugin version if readable
- workspace and domain
- context pull status
- local cache path or missing-cache reason
- status-line install result, including any project-local override warning
- status-line state: `mcp:write-ready`, `mcp:read-only`, `mcp:error`, `mcp:stale`, or `mcp:unverified`
- pending review count
- update path if needed: `/chatdata:update`
- next command: `/chatdata:audit-context`, `/chatdata:sync-context`, `/chatdata:publish-patch`, or `/chatdata:update`
