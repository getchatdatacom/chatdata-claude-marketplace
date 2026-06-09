# ChatData MCP

Local MCP server for connecting Claude Code or Codex to the ChatData Context Hub.

## Local Build

```bash
npm install
npm run build
node dist/index.js
```

## Activation

1. Open ChatData Settings for the intended workspace.
2. Click **Copy terminal setup command**.
3. Paste the full command into Terminal and press Return.
4. Run `chatdata_doctor` to verify domain, consent, and hub access.

The raw token/config JSON is only for debugging. Do not paste raw JSON into Terminal.

## Surface Router

Choose the client surface before registering MCP.

| Surface | MCP registration | Extra setup |
| --- | --- | --- |
| Claude Code | `claude mcp add --scope user chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js"` | Install or update the ChatData Claude plugin for `/chatdata:` commands. |
| Codex | `codex mcp add chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js"` | No Claude plugin and no `/chatdata:` slash commands. |

If both `claude` and `codex` CLIs are installed, use the current chat/client or the user's explicit request to choose the surface.

For customer setup, the direct build path uses the ChatData-owned marketplace distribution repo:

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

After login, click **Copy terminal setup command**, paste that whole command into Terminal, and press Return. The generated command contains the issued config and writes it to `~/.chatdata/config.json`.

The raw **Client config** JSON is shown for debugging and manual setup. Do not paste the raw JSON directly into Terminal. If Terminal prints `zsh: command not found: token:` or `zsh: command not found: workspace_id:`, you pasted the JSON by mistake; go back to Settings and copy the terminal setup command instead.

Add the server to the selected surface.

Claude Code:

```bash
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
test -f "$CHATDATA_MCP_DIR/dist/index.js" || { echo "ChatData MCP is not built yet. Run the build command first."; exit 1; }
claude mcp add --scope user chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js"
```

If Claude prints `MCP server chatdata already exists in user config`, the server is already registered. Check the existing entry:

```bash
claude mcp get chatdata
```

Continue if it shows `Status: Connected`, `Command: node`, and the ChatData `packages/mcp/dist/index.js` path. If it points to an old or wrong path, reset only Claude's MCP pointer:

```bash
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
test -f "$CHATDATA_MCP_DIR/dist/index.js" || { echo "ChatData MCP is not built yet. Run the build command first."; exit 1; }
claude mcp remove chatdata -s user 2>/dev/null || true
claude mcp add --scope user chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js"
```

Codex:

```bash
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
test -f "$CHATDATA_MCP_DIR/dist/index.js" || { echo "ChatData MCP is not built yet. Run the build command first."; exit 1; }
codex mcp add chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js"
```

Verify the selected surface can see the server.

Claude Code:

```bash
claude mcp list
```

Codex:

```bash
codex mcp list
codex mcp get chatdata
```

Restart or reconnect the selected client, then ask in natural language:

```text
Use the ChatData MCP server and run the chatdata_doctor tool. Show me the JSON result.
```

Do not type only `chatdata_doctor` into Claude Code. If a planning screen opens, press Esc and use the full sentence above. In Codex, use the same natural-language request if the MCP tools are not exposed yet.

To catch a stale or wrong workspace token, pass the company domain you expected:

```text
Use the ChatData MCP server and run chatdata_doctor with expected_domain set to company.com. Show me the JSON result.
```

The server writes config to `~/.chatdata/config.json`:

```json
{
  "token": "<jwt>",
  "workspace_id": "<workspace-id>",
  "domain": "company.com",
  "hub_url": "https://getchatdata.com/api",
  "consent": {
    "version": "metadata-sync-v1",
    "granted_at": "2026-05-30T00:00:00.000Z"
  },
  "last_pull_revision": null
}
```

The token is domain-scoped. The hub verifies `workspace_id` and `domain` from the JWT before returning workspace state.

## Context Tools

The server mirrors approved context into:

```text
~/.chatdata/context/<domain-slug>/
```

Available tools:

- `chatdata_status()`
- `chatdata_doctor(expected_domain?)`
- `chatdata_pull_context(since_revision?)`
- `chatdata_search_context(q, include_drafts?)`
- `chatdata_read_context_file(path)`
- `chatdata_propose_patch(path, base_hash, new_markdown, purpose)`
- `chatdata_list_review_queue()`
- `chatdata_run_context_steward()`
- `chatdata_publish_patch(patch_id)`
- `chatdata_create_metric_card(input)`
- `chatdata_save_answer_path(input)`
- `chatdata_create_proof_receipt(input)`
- `chatdata_diff_versions(path, v1, v2)`
- `chatdata_rollback(path, version)`
- `chatdata_list_conflicts()`
- `chatdata_resolve_conflict(conflict_id, patch_id?, dismiss?)`
- `chatdata_list_members()`
- `chatdata_export_bundle()`

Context file tools accept only relative Markdown paths like `metrics/activation-rate.md`. Absolute paths and `..` parent-directory segments are rejected before the MCP reads the local cache or calls the hub.

Use `chatdata_create_metric_card` only for metric definitions: counts, rates, amounts, or status metrics with explicit grain, owner, source, raw SQL SoT when present, verified dashboard/report SoT when present, freshness, caveats, business context, uncertainty policy, and validation rules. Put playbooks, attribution routing, source stacks, evals, decisions, and answer paths in their matching context folders instead of `metrics/`.

For recurring answers, `chatdata_save_answer_path` should include the canonical question, answer state, metric id, SQL or retrieval path, raw SQL SoT usage, verified dashboard/report tie-out, business-context check, validation rule, uncertainty policy, caveats, and reuse rule.

For proof receipts, `chatdata_create_proof_receipt` should include the answer state, evidence checked, source path, raw SQL SoT or verified dashboard/report tie-out, validation result, business-context check, uncertainty or validation interval, caveats, and next action.

Structured writes and proposed patches run through ChatData CDO pre-review before they become publishable human-review work. The response may include `cdo_pre_review`; if its decision is `needs_rewrite`, fix the required rewrites before asking a governance reviewer to approve the patch.

On startup, the MCP server tries a best-effort pull. If the hub is unavailable, local-cache reads still work.

`chatdata_pull_context` uses incremental pulls after the first successful pull. A response with `pulled_count: 0` means no files changed since `last_pull_revision`; it does not mean the workspace is empty. Use `file_count`, `cached_count`, `context_available`, and `empty_workspace` to report whether approved context is available in the local cache.
