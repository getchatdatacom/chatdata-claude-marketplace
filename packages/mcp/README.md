# ChatData MCP

Local MCP fallback server for connecting Claude Code, Codex, Cursor, OpenClaw, or another MCP-capable client to the ChatData Context Hub.

The default customer install is remote HTTP MCP:

```json
{
  "mcpServers": {
    "chatdata": {
      "type": "http",
      "url": "https://getchatdata.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_CHATDATA_KEY"
      }
    }
  }
}
```

Create the key in ChatData Settings, paste the snippet into Claude Code, Cursor, or another remote-HTTP-capable MCP client, then run `chatdata_doctor`. Claude Code customers must also install the ChatData Claude plugin. Use this local package only when the client cannot use remote HTTP MCP yet or when you need local cache/fallback behavior.

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
| Claude Code | `claude mcp add --scope user chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js" --client=claude-code` | Required: install or update the ChatData Claude plugin for `/chatdata:` commands and Claude prompt/source-read hooks. |
| Codex | `codex mcp add chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js" --client=codex` | No Claude plugin and no `/chatdata:` slash commands. |

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

Add the server to the selected surface. For Claude Code, also install the plugin from the same ChatData marketplace distribution:

```bash
claude plugin marketplace add https://github.com/getchatdatacom/chatdata-claude-marketplace.git
claude plugin marketplace update chatdata
claude plugin install chatdata@chatdata
```

Then run `/reload-plugins` or restart Claude Code before checking `/chatdata:status`.

Claude Code:

```bash
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
test -f "$CHATDATA_MCP_DIR/dist/index.js" || { echo "ChatData MCP is not built yet. Run the build command first."; exit 1; }
claude mcp add --scope user chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js" --client=claude-code
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
claude mcp add --scope user chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js" --client=claude-code
```

Codex:

```bash
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
test -f "$CHATDATA_MCP_DIR/dist/index.js" || { echo "ChatData MCP is not built yet. Run the build command first."; exit 1; }
codex mcp add chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js" --client=codex
```

If an existing Codex entry points to an old path or lacks `--client=codex`, reset it:

```bash
CHATDATA_INSTALL_REPO_DIR="${CHATDATA_INSTALL_REPO_DIR:-$HOME/.chatdata/chatdata-claude-marketplace}"
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
test -f "$CHATDATA_MCP_DIR/dist/index.js" || { echo "ChatData MCP is not built yet. Run the build command first."; exit 1; }
codex mcp remove chatdata 2>/dev/null || true
codex mcp add chatdata -- node "$CHATDATA_MCP_DIR/dist/index.js" --client=codex
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

## Security Posture

The MCP server stores config, approved metadata, local queue files, and derived proof metadata under `~/.chatdata`. It is not an operating-system sandbox. Host agents, shell commands, and connected warehouses run with the permissions the user grants in that host environment.

Use scoped, reviewed, approved, or metadata-only language in customer setup and proof artifacts. Do not claim sandboxing or subprocess isolation unless a separate isolated runtime actually exists.

## Context Tools

The server mirrors approved context into:

```text
~/.chatdata/context/<domain-slug>/
```

Available tools:

- `chatdata_status()`
- `chatdata_doctor(expected_domain?)`
- `chatdata_agent_context(surface?)`
- `chatdata_list_guidance(kind?)`
- `chatdata_read_guidance(id)`
- `chatdata_pull_context(since_revision?)`
- `chatdata_list_local_artifacts(type?)`
- `chatdata_read_local_artifact(path)`
- `chatdata_search_context(q, include_drafts?)`
- `chatdata_read_context_file(path)`
- `chatdata_propose_patch(path, base_hash, new_markdown, purpose)`
- `chatdata_list_review_queue()`
- `chatdata_run_context_steward()`
- `chatdata_publish_patch(patch_id)`
- `chatdata_record_session_context(input)`
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

`chatdata_agent_context`, `chatdata_list_guidance`, and `chatdata_read_guidance` keep setup docs thin by returning fetchable, bundled guidance only when an agent needs it. The guidance bodies are non-secret and bundled with the MCP package.

`chatdata_pull_context` also writes `artifacts/manifest.json` under the local cache. The manifest is a derived metadata-only view of approved metric packets, answer paths, proof receipts, and trusted artifacts. `chatdata_list_local_artifacts` and `chatdata_read_local_artifact` return structured trust fields and never return raw rows.

Use `chatdata_create_metric_card` only for metric definitions: counts, rates, amounts, or status metrics with explicit grain, owner, source, raw SQL SoT when present, verified dashboard/report SoT when present, freshness, caveats, business context, uncertainty policy, and validation rules. Put playbooks, attribution routing, source stacks, evals, decisions, and answer paths in their matching context folders instead of `metrics/`.

For recurring answers, `chatdata_save_answer_path` should include the canonical question, answer state, metric id, SQL or retrieval path, raw SQL SoT usage, verified dashboard/report tie-out, business-context check, decision, grounded anchors, current frame, disconfirming evidence, alternate frames, tripwires, validation rule, uncertainty policy, caveats, action implications, and reuse rule.

For proof receipts, `chatdata_create_proof_receipt` should include the answer state, evidence checked, source path, raw SQL SoT or verified dashboard/report tie-out, validation result, business-context check, decision, grounded anchors, committed frame, disconfirming evidence, alternate frames tested, tripwires, uncertainty or validation interval, caveats, action implications, and next action.

For session/query writeback, `chatdata_record_session_context` should capture the question, answer state, summary, evidence checked, reusable context delta, source/tie-out fields, business-context check, uncertainty, frame, anchors, disconfirming evidence, validation, caveats, and next action. It writes a pending proof receipt through the hub; it does not approve context by itself.

## Reliability Contract

Use [`../../docs/product/chatdata-reliability-contract.md`](../../docs/product/chatdata-reliability-contract.md) as the reliability gate for Codex and MCP-only clients.

Codex does not have `/chatdata:` plugin commands, so the MCP flow should make the reliability steps explicit:

1. Run `chatdata_doctor`.
2. Run `chatdata_pull_context`.
3. For KPI, traffic, funnel, revenue, retention, conversion, activation, usage, or other business-metric requests, search or read ChatData metric context before querying PostHog, warehouse, BI, or file tools.
4. Use targeted reads for the metric, source, answer path, proof receipt, caveat, or eval.
5. Choose `answered`, `clarification_needed`, `needs_analyst_review`, or `refused` before polishing the answer.
6. Record proof with `chatdata_create_proof_receipt` before calling a result trusted or reusable.
7. Save a recurring answer path only when owner, route, validation, caveats, uncertainty state, and reuse rule are explicit.

Reliability failures include quietly wrong answers, missing answer state, unsupported numeric confidence, source mismatches, missing caveats, missing uncertainty interval, and claims that imply the agent checked a source it could not access.

Structured writes and proposed patches run through ChatData CDO pre-review before they become publishable human-review work. The response may include `cdo_pre_review`; if its decision is `needs_rewrite`, fix the required rewrites before asking a governance reviewer to approve the patch.

On startup, the MCP server tries a best-effort pull. If the hub is unavailable, local-cache reads still work.

`chatdata_pull_context` uses incremental pulls after the first successful pull. A response with `pulled_count: 0` means no files changed since `last_pull_revision`; it does not mean the workspace is empty. Use `file_count`, `cached_count`, `context_available`, and `empty_workspace` to report whether approved context is available in the local cache.
