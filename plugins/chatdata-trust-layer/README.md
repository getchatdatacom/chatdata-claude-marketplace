# ChatData For Claude Code

ChatData for Claude Code is the plugin-first wedge for ChatData.

It supports two modes with the same core:

1. `Principal analyst mode`
   An individual founder, operator, PM, or data lead uses Claude Code as an independent chief data officer to investigate metrics, prep a weekly business review, and write operating briefs from trusted artifacts.
2. `Builder mode`
   An analytics engineer or data owner uses the same plugin to bootstrap the trust-layer repo, draft metric packets, publish immutable Slack bundles, and keep reviewed answer paths visible instead of burying them in chat transcripts.

This is one product, not two disconnected plugins. The plugin is the wedge. Slack is the organizational expansion surface.

## Why This Should Be A Plugin

This is worth being a plugin because it can:

- deliver value to one operator before an admin-heavy workspace rollout exists
- package builder workflows like bootstrap, scan, draft, publish, and drift checks into installable commands
- use cross-session state, stronger retrieval, and batching for exploratory or file-heavy work
- hand Slack a stronger reviewed trust layer instead of making Slack do first-time setup

The discipline is important: keep metric packets, reviewed answer paths, and evals readable and customer-owned. The plugin is the leverage layer, not the only copy of business logic.

When a customer or internal stack already has a strong metadata substrate, such as Data Hub, the plugin should use that layer for catalog, lineage, ownership, and discovery context instead of recreating those primitives locally.

## Always-On MCP Loop

Every principal or builder workflow must use the shared ChatData MCP state. The plugin should not let useful analysis live only in a chat transcript.

Default loop:

1. Run `chatdata_doctor` before stakeholder-facing analysis, sync, proof, review, or publish work.
2. Run `chatdata_pull_context` before answering so the session uses the latest approved context and local cache.
3. Use `chatdata_search_context` or `chatdata_read_context_file` for the specific metric, source, answer path, proof receipt, or caveat. Do not dump full inventories unless the user asks.
4. Answer with a compact trust label and the evidence that actually matters.
5. If the work created reusable business knowledge, run the smallest write tool: `chatdata_create_metric_card`, `chatdata_save_answer_path`, `chatdata_create_proof_receipt`, or `chatdata_propose_patch`.
6. Run `/chatdata:audit-context` or `/chatdata:proof` before calling the result trusted, ready, reusable, or fixed.

This is how audit and sync stay coupled: audit proves the context can be trusted; sync saves new reusable context back into the hub. A successful investigation that does not sync its corrected definition, answer path, caveat, or proof receipt is incomplete.

## Shared Onboarding Loop

Run `/chatdata:onboarding` for the first customer session or when a new teammate joins an existing workspace.

Onboarding is multiplayer by default:

1. Pull approved MCP context first.
2. Use existing metrics, answer paths, source references, decisions, playbooks, evals, and proof receipts as the directional setup map.
3. Ask only for missing or conflicting details.
4. Save reviewed metric cards, answer paths, proof receipts, or proposed patches through MCP.
5. Pull again so every plugin user and Slack surface sees the same context.

If context already exists, ChatData should not ask the user to repeat it. The existing shared context should make onboarding feel pre-filled and opinionated. Pending patches can guide the conversation, but they are not trusted until reviewed and published.

The helper `bin/onboarding_packet.py` can turn a local trust-layer repo into reviewable shared onboarding patches:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/bin/onboarding_packet.py" <trust-layer-repo> --include-markdown
```

Those patches create shared context for the onboarding packet, source inventory, scope decision, and sync playbook. Propose them with `chatdata_propose_patch` so one user's onboarding work becomes reusable workspace memory.

## Analyst Standard Encoded

The plugin encodes the working standard from the current `ai-analyst-lab/ai-analyst` and `parasdoshicom/ai-plus-data` references:

- question framing: start with the decision, metric, grain, period, segment, and hypothesis before writing queries or summaries
- metric trust packets: official definition, owner, grain, source, freshness, caveats, validation rules, approved answer paths, and eval questions
- source tie-out: compare generated answers to blessed dashboard/model/query totals and stop when foundational numbers do not match
- validation pass: rederive key numbers, check arithmetic, compare against expected ranges, inspect joins/filters, and name confidence
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
- `/chatdata:publish-slack-context`
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

That script creates a plugin zip, a trust-repo template zip, and a Slack manifest under `dist/chatdata-products/`.

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
git -C "$CHATDATA_INSTALL_REPO_DIR" pull --ff-only
CHATDATA_MCP_DIR="${CHATDATA_MCP_DIR:-$CHATDATA_INSTALL_REPO_DIR/packages/mcp}"
cd "$CHATDATA_MCP_DIR" && npm install && npm run build
```

Then run `/reload-plugins` or restart Claude Code, followed by `/chatdata:status`.

## Product modes

### Principal analyst mode

Use the plugin when one person needs principal-level data science without waiting on a full team workflow.

Typical outputs:

- metric movement investigation
- weekly business review prep
- executive operating brief
- follow-up questions and caveats worth carrying into Slack later
- skeptical second-pass verdict before calling an answer trusted or ready

### Builder mode

Use the same plugin when you are creating or maintaining the trust layer that powers the Slack app.

Typical outputs:

- trust-layer repo scaffold
- metric packets
- benchmark queries
- eval sets
- immutable Slack bundle publish
- drift and review-readiness checks
- skeptical second-pass proof before a trust-layer change is marked complete

## Verification Standard

ChatData should not say "done", "ready", "trusted", "fixed", or "this should work" unless it has checked the files and run the smallest relevant proof.

Use `/chatdata:but-for-real` after meaningful plugin, trust-layer, or Slack-bundle changes. The expected result is a short verdict:

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
- `bin/publish_bundle.py <repo-path>` renders an immutable published bundle from canonical files.

To publish directly to the Slack runtime once the Worker is deployed:

```bash
python3 bin/publish_bundle.py <repo-path> \
  --runtime-url https://api.getchatdata.com \
  --admin-token "$CHATDATA_ADMIN_TOKEN"
```

## Template repo

The template copied by `bootstrap_repo.py` lives under [`./assets/template-repo`](./assets/template-repo).

See [`../../docs/product/chatdata-install-and-distribution.md`](../../docs/product/chatdata-install-and-distribution.md) for the exact two-product install path.
