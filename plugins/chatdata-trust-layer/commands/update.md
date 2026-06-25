---
description: Update the ChatData Claude plugin and MCP package to the latest marketplace release.
---

# Update

Use this command when a customer asks how to get the latest ChatData commands, when `/chatdata:status` says the install looks stale, or after ChatData publishes a new plugin or MCP release.

This mirrors the Wozcode update shape: one product command first, manual marketplace fallback if the command is too old, then reload plugins or restart the client.

## Sequence

1. Explain the update in one sentence:

   "This updates both ChatData pieces: the Claude plugin that owns `/chatdata:` commands and the MCP package that syncs shared workspace context."

2. Use shell to run the plugin marketplace update:

```bash
claude plugin marketplace update chatdata
```

If the marketplace name is not recognized, run the explicit marketplace add command, then retry the update:

```bash
claude plugin marketplace add https://github.com/getchatdatacom/chatdata-claude-marketplace.git
claude plugin marketplace update chatdata
```

If the marketplace is named differently on the customer machine, inspect it with:

```bash
claude plugin marketplace list
```

Then run `claude plugin marketplace update <marketplace-name>`.

3. Use shell to update the installed plugin:

```bash
claude plugin update chatdata@chatdata
```

4. Use shell to update and rebuild the MCP package:

```bash
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
CHATDATA_INSTALL_REPO_URL="${CHATDATA_INSTALL_REPO_URL:-https://github.com/getchatdatacom/chatdata-claude-marketplace.git}"
if [ -d "$CHATDATA_INSTALL_REPO_DIR/.git" ]; then
  git -C "$CHATDATA_INSTALL_REPO_DIR" pull --ff-only
elif [ -e "$CHATDATA_INSTALL_REPO_DIR" ]; then
  echo "Move $CHATDATA_INSTALL_REPO_DIR or set CHATDATA_INSTALL_REPO_DIR to an empty path, then rerun."
  exit 1
else
  mkdir -p "$(dirname "$CHATDATA_INSTALL_REPO_DIR")"
  git clone "$CHATDATA_INSTALL_REPO_URL" "$CHATDATA_INSTALL_REPO_DIR"
fi
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
cd "$CHATDATA_MCP_DIR" && npm install && npm run build && test -f "$CHATDATA_MCP_DIR/dist/index.js"
```

5. Use shell to verify the plugin and MCP pointer:

```bash
claude plugin list
claude mcp get chatdata
```

If `claude mcp get chatdata` points to a missing or old `dist/index.js`, reset only the MCP pointer:

```bash
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
test -f "$CHATDATA_MCP_DIR/dist/index.js" || { echo "ChatData MCP is not built yet. Run the build command first."; exit 1; }
claude mcp remove chatdata -s user 2>/dev/null || true
claude mcp add --scope user chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js" --client=claude-code
```

6. Use shell to repair any ChatData status-line pointer that is pinned to an old plugin cache:

```bash
python3 - <<'PY'
import json, pathlib, shlex

home = pathlib.Path.home()
installed_path = home / ".claude" / "plugins" / "installed_plugins.json"
try:
    installed = json.loads(installed_path.read_text())
except Exception:
    print("Skipped ChatData status line repair: installed_plugins.json missing")
    raise SystemExit(0)

entries = installed.get("plugins", {}).get("chatdata@chatdata", [])
entry = next((item for item in entries if item.get("scope") == "user"), entries[0] if entries else None)
if not entry or not entry.get("installPath"):
    print("Skipped ChatData status line repair: chatdata@chatdata install path not found")
    raise SystemExit(0)

status_script = pathlib.Path(entry["installPath"]) / "scripts" / "chatdata-status-line.js"
if not status_script.exists():
    print(f"Skipped ChatData status line repair: missing {status_script}")
    raise SystemExit(0)

settings_paths = [home / ".claude" / "settings.local.json"]
current = pathlib.Path.cwd().resolve()
while True:
    settings_paths.append(current / ".claude" / "settings.local.json")
    if current == current.parent:
        break
    current = current.parent
seen = set()
updated = []
for raw_path in settings_paths:
    path = raw_path.resolve()
    if path in seen or not path.exists():
        continue
    seen.add(path)
    try:
        settings = json.loads(path.read_text())
    except Exception:
        continue
    status_line = settings.get("statusLine")
    command = status_line.get("command") if isinstance(status_line, dict) else ""
    if "chatdata-status-line.js" not in command:
        continue
    settings["statusLine"] = {"type": "command", "command": "node " + shlex.quote(str(status_script))}
    path.write_text(json.dumps(settings, indent=2) + "\n")
    updated.append(str(path))

print("ChatData status line points to " + str(status_script))
if updated:
    print("Updated " + ", ".join(updated))
PY
```

7. Tell the user to apply the update:

```text
/reload-plugins
```

If `/reload-plugins` is unavailable in their client, tell them to close and reopen Claude Code.

8. After reload or restart, have the user run:

```text
/chatdata:status
```

## Manual Fallback For Old Installs

If the installed ChatData plugin is too old to have `/chatdata:update`, send this exact fallback:

```bash
claude plugin marketplace add https://github.com/getchatdatacom/chatdata-claude-marketplace.git
claude plugin marketplace update chatdata
claude plugin update chatdata@chatdata
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
git -C "$CHATDATA_INSTALL_REPO_DIR" pull --ff-only
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
cd "$CHATDATA_MCP_DIR" && npm install && npm run build
```

Then run `/reload-plugins` or restart Claude Code.

## Required Output

- plugin marketplace update result
- plugin update result
- MCP repo/build result
- plugin verification result
- MCP pointer result
- status-line pointer result
- apply step: `/reload-plugins` or restart Claude Code
- next command: `/chatdata:status`

Do not say the update is applied until the user has reloaded plugins or restarted the client. Claude can keep using the old cached plugin inside the current session.
