# ChatData For Claude Code

ChatData for Claude Code is the required Claude Code companion for the ChatData MCP trust layer.

It supports two modes with the same core:

1. `Principal analyst mode`
   An individual founder, operator, PM, or data lead uses Claude Code as an independent chief data officer to investigate metrics, prep a weekly business review, and write operating briefs from trusted artifacts.
2. `Builder mode`
   An analytics engineer or data owner uses the same plugin to bootstrap the trust-layer repo, draft metric packets, publish reviewed MCP context, and keep reviewed answer paths visible instead of burying them in chat transcripts.

This is one product, not two disconnected surfaces. Claude Code customers install both the ChatData MCP server and this plugin. Cursor, Codex, OpenClaw, and other MCP-capable clients use MCP only. The plugin exists to make Claude setup, review, evals, local trust work, and live prompt/source-read routing harder to miss. Slack is a later expansion surface.

## Why This Plugin Still Exists

This is worth being a plugin because it can:

- accelerate one operator before an admin-heavy workspace rollout exists
- package builder workflows like bootstrap, scan, draft, publish, and drift checks into installable commands
- use cross-session state, stronger retrieval, and batching for exploratory or file-heavy work
- make proof receipt review, saved-path editing, and local artifact maintenance easier than plain MCP config

The discipline is important: keep metric packets, proof receipts, reviewed answer paths, and evals readable, MCP-backed, and customer-owned. The plugin is the required Claude leverage layer, not a second source of business truth.

When a customer or internal stack already has a strong metadata substrate, such as Data Hub, the plugin should use that layer for catalog, lineage, ownership, and discovery context instead of recreating those primitives locally.

## Warehouse Query Routing

The plugin ships a built-in `warehouse-query` skill at `skills/warehouse-query/SKILL.md`.

Use `/chatdata:warehouse-query` for warehouse, BI, metric, dashboard, SQL, funnel, retention, revenue, pipeline, and recurring analytics questions. It forces the same route across customers:

1. MCP health and approved context
2. metric packet or semantic layer
3. reviewed answer path
4. trusted SQL, dashboard/report artifact, proof receipt, or eval
5. source references and customer business context
6. raw SQL fallback only after the trusted route cannot answer

Bootstrap repos also include `skills/customer-analytics-skill.md` and `sources/domain-reference-template.md`. Customers fill those with entity disambiguation, domain references, date-window conventions, freshness lag, owner routing, and gotchas. The generic plugin skill supplies the workflow; the customer files supply the business-specific facts.

## Always-On MCP Loop

Every principal or builder workflow must use the shared ChatData MCP state. The plugin should not let useful analysis live only in a chat transcript.

Default loop:

1. Run `chatdata_doctor` before stakeholder-facing analysis, sync, proof, review, or publish work.
2. For a business-metric question, call `chatdata_prepare_metric_answer` before any direct source read. It selects a bounded approved context bundle, checks the workspace source, blocks unresolved corrections, plans validation, and returns a visible answer state without executing the source.
3. Run `chatdata_pull_context` for broader non-metric context or when the prepared route directs it.
4. Use `chatdata_search_context` or `chatdata_read_context_file` only when the prepared route or broader workflow needs another specific item. Do not dump full inventories.
5. For any exploratory analytics question, apply the frame trail by default: decision, 3-4 grounded anchors, candidate frames, disconfirming evidence, alternate-frame test, committed frame or downgrade, tripwires, and action implications.
6. Answer with a compact trust label and the evidence that actually matters.
7. If the work created reusable business knowledge, run the smallest write tool: `chatdata_record_session_context`, `chatdata_create_metric_card`, `chatdata_save_answer_path`, `chatdata_create_proof_receipt`, or `chatdata_propose_patch`.
8. Submit reviewed outcome feedback through `chatdata_submit_answer_feedback`, then run `chatdata_run_context_steward` and `chatdata_list_review_queue` after MCP writes.
9. Run `/chatdata:validate`, `/chatdata:validation-stack`, `/chatdata:but-for-real`, `/chatdata:audit-context`, or `/chatdata:proof` before calling the result trusted, ready, reusable, or fixed.

This is how audit and sync stay coupled: audit proves the context can be trusted; sync saves new reusable context back into the hub. A successful investigation that does not sync its corrected definition, answer path, caveat, or proof receipt is incomplete.
The user should not need to invoke `/chatdata:warehouse-query` to get this behavior. When ChatData is active and the user asks an analytics question, the default principal analyst harness routes through the same context, frame, validation, and proof gates.

The required Claude Code plugin ships a session hook in `hooks/hooks.json` and a ChatData status-line installer in `scripts/install-status-line.py`. The hook does not replace MCP tools; it reminds Claude Code at session start, detects metric-style user prompts, and checks likely source reads so recurring analytics work routes through ChatData context before PostHog, warehouse, BI, spreadsheet, or file tools. On session start, the hook quietly runs the installer so user-level `~/.claude/settings.json` points `statusLine` at ChatData by default and backs up any previous footer under `chatdata.previousStatusLine`. Cursor, Codex, and other MCP clients get the same contract through `chatdata_agent_context`, `chatdata_list_guidance`, and `chatdata_read_guidance`, but hard cross-client enforcement belongs in the remote MCP metric gateway.

## Shared Onboarding Loop

Run `/chatdata:onboarding` for the first customer session or when a new teammate joins an existing workspace.

Onboarding is multiplayer by default:

1. Pull approved MCP context first.
2. Use existing metrics, answer paths, source references, decisions, playbooks, evals, and proof receipts as the directional setup map.
3. Ask only for missing or conflicting details.
4. Save reviewed metric cards, answer paths, proof receipts, or proposed patches through MCP.
5. Pull again so every Claude/Codex MCP user sees the same context.

If context already exists, ChatData should not ask the user to repeat it. The existing shared context should make onboarding feel pre-filled and opinionated. Pending patches can guide the conversation, but they are not trusted until reviewed and published.

The helper `bin/onboarding_packet.py` can turn a local trust-layer repo into reviewable shared onboarding patches:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/bin/onboarding_packet.py" <trust-layer-repo> --include-markdown
```

Those patches create shared context for the onboarding packet, source inventory, scope decision, and sync playbook. Propose them with `chatdata_propose_patch` so one user's onboarding work becomes reusable workspace memory.

## Analyst Standard Encoded

The plugin encodes the working standard from the current `ai-analyst-lab/ai-analyst` and `parasdoshicom/ai-plus-data` references:

- question framing: start with the decision, metric, grain, period, segment, grounded anchors, and candidate explanatory frames before writing queries or summaries
- metric trust packets: official definition, owner, grain, source, raw SQL SoT when present, verified dashboard/report SoT, business context, freshness, caveats, validation rules, approved answer paths, and eval questions
- source tie-out: compare generated answers to blessed dashboard/model/raw-SQL/report totals and stop when foundational numbers do not match
- business-context pass: compare the claim against the customer's company type, revenue model, segment logic, operating cadence, and expected metric behavior
- validation pass: rederive key numbers, check arithmetic, compare against expected ranges, inspect joins/filters, and name confidence
- frame-validation pass: require the current frame, supporting anchors, disconfirming evidence, alternate frames tested, tripwires, and action implications for exploratory answers
- uncertainty pass: attach a statistical confidence interval, deterministic validation interval, or explicit `not available` state for every numeric answer
- self-correcting SQL loop: state assumptions, run the query, inspect errors or surprises, revise, then validate the final answer
- answer memory: save recurring, owner-reviewed paths so the next user gets the trusted route instead of another bespoke analysis

Capability promise:

- A non-data operator should get principal-level scaffolding: metric framing, trusted source selection, caveat handling, and a clear next decision.
- A data scientist should operate above their current level by getting stricter framing, tie-outs, validation prompts, and reusable answer-path capture.

Do not claim those outcomes are proven for a customer until a proof receipt or eval run demonstrates them for that workspace.

## Intended commands

### Start here

- `/chatdata:start`
- `/chatdata:commands`
- `/chatdata:help`
- `/chatdata:login`
- `/chatdata:status`
- `/chatdata:update`
- `/chatdata:onboarding`
- `/chatdata:settings`
- `/chatdata:catalog`

### Principal analyst mode

- `/chatdata:question-framing`
- `/chatdata:warehouse-query`
- `/chatdata:prepare-metric-answer`
- `/chatdata:investigate`
- `/chatdata:investigate-metric`
- `/chatdata:impact`
- `/chatdata:prepare-wbr`
- `/chatdata:write-operating-brief`
- `/chatdata:story-and-action`
- `/chatdata:validate`
- `/chatdata:validation-stack`
- `/chatdata:proof`
- `/chatdata:proof-receipts`
- `/chatdata:but-for-real`

### Builder mode

- `/chatdata:metrics`
- `/chatdata:connect-data`
- `/chatdata:context-bootstrap`
- `/chatdata:company-repo`
- `/chatdata:audit-context`
- `/chatdata:sync-context`
- `/chatdata:bootstrap-repo`
- `/chatdata:scan-sources`
- `/chatdata:draft-metric-packet`
- `/chatdata:build-benchmark`
- `/chatdata:benchmark`
- `/chatdata:generate-evals`
- `/chatdata:create-evals`
- `/chatdata:drift-check`
- `/chatdata:feedback-memory`
- `/chatdata:publish-patch`
- `/chatdata:review-readiness`
- `/chatdata:but-for-real`

### Account and session

- `/chatdata:license`
- `/chatdata:trial-and-privacy`
- `/chatdata:activate-session`

## Install

For local development, launch Claude Code with the plugin directory explicitly:

```bash
CHATDATA_REPO="${CHATDATA_REPO:-$HOME/Documents/ChatData}"
claude --plugin-dir "$CHATDATA_REPO/plugins/chatdata-trust-layer"
```

For customer setup, use the ChatData-owned Git marketplace repo:

```bash
claude plugin marketplace add https://github.com/getchatdatacom/chatdata-claude-marketplace.git
claude plugin install chatdata@chatdata
```

The same marketplace repo also carries the customer-facing MCP package under `packages/mcp`.

To prepare a customer-facing distribution bundle, run:

```bash
CHATDATA_REPO="${CHATDATA_REPO:-$HOME/Documents/ChatData}"
"$CHATDATA_REPO/scripts/package_chatdata_products.sh" https://api.getchatdata.com
```

That script creates a plugin zip and a trust-repo template zip under `dist/chatdata-products/`. Slack manifest output is later-stage packaging, not the active product path.

Slack manifest packaging is opt-in:

```bash
"$CHATDATA_REPO/scripts/package_chatdata_products.sh" https://api.getchatdata.com --include-slack
```

## Update

Run `/chatdata:update` inside Claude Code to update both installed ChatData pieces:

1. the ChatData Claude plugin from the marketplace
2. the ChatData MCP package under `~/.chatdata/chatdata-claude-marketplace`

If the installed plugin is too old to have `/chatdata:update`, use the manual fallback:

```bash
claude plugin marketplace add https://github.com/getchatdatacom/chatdata-claude-marketplace.git
claude plugin marketplace update chatdata
claude plugin update chatdata@chatdata
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
cd "$CHATDATA_MCP_DIR" && npm install && npm run build
```

Then run `/reload-plugins` or restart Claude Code, followed by `/chatdata:status`. The status command installs or repairs the ChatData footer from the newly installed plugin path.

## Product modes

### Principal analyst mode

Use the plugin when one person needs principal-level data science, local scaffolding, or review workflows beyond plain MCP access.

Typical outputs:

- metric movement investigation
- weekly business review prep
- executive operating brief
- follow-up questions and caveats worth saving into MCP context
- skeptical second-pass verdict before calling an answer trusted or ready

### Builder mode

Use the same plugin when you are creating or maintaining the trust layer that powers MCP-capable client workflows.

Typical outputs:

- trust-layer repo scaffold
- metric packets
- benchmark queries
- eval sets
- reviewed context publishing
- drift and review-readiness checks
- skeptical second-pass proof before a trust-layer change is marked complete

## Verification Standard

ChatData should not say "done", "ready", "trusted", "fixed", or "this should work" unless it has checked the files and run the smallest relevant proof.

Use `/chatdata:but-for-real` after meaningful plugin, MCP, or trust-layer changes. The expected result is a short verdict:

- `proved`
- `partially proved`
- `not proved`

The verdict must list the proof checked, the most likely remaining failure, and the next fix or verification step.

## Local helper scripts

Install the Python helper dependency before running bundle publishing locally:

```bash
python3 -m pip install -r plugins/chatdata-trust-layer/requirements.txt
```

- `bin/bootstrap_repo.py <target-dir>` copies the template repo into a customer-owned path.
- `bin/publish_bundle.py <repo-path>` renders an immutable published bundle from canonical files. It is strict by default: customer-specific skill and source placeholders must be filled before publish. Use `--allow-template-placeholders` only for local packaging smoke tests of the demo scaffold.

Later-stage Slack publishing, only after that surface is reactivated:

```bash
python3 bin/publish_bundle.py <repo-path> \
  --runtime-url https://api.getchatdata.com \
  --admin-token "$CHATDATA_ADMIN_TOKEN"
```

## Template repo

The template copied by `bootstrap_repo.py` lives under [`./assets/template-repo`](./assets/template-repo).

See [`../../docs/product/chatdata-install-and-distribution.md`](../../docs/product/chatdata-install-and-distribution.md) for the plugin and MCP install path.
