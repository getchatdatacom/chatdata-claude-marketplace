# ChatData Trust Layer Repo

Customer-owned trust-layer repo for the active ChatData product surfaces:

- ChatData for Claude Code as the principal analyst workbench
- ChatData for Codex via MCP as the AI-native data catalog and workflow surface

This repo is the canonical source of truth for:

- metric packets
- answer paths
- customer analytics skill and source references
- trusted benchmark SQL
- trusted artifact metadata
- eval questions
- operating briefs and WBR prep inputs
- published MCP context bundles

Any runtime should read only the immutable files under `published/`.

The publish step copies canonical content into `published/` and writes a runtime bundle payload. Slack-specific bundle files are later-stage compatibility artifacts, not the active product path.

## First Files To Fill

Start with:

1. `skills/customer-analytics-skill.md`
   The customer-specific routing contract: semantic layer, entity disambiguation, date windows, freshness, out-of-scope rules, and provenance footer.
2. `sources/domain-reference-template.md`
   Copy this once per major domain or governed dataset. Keep each file short enough that an agent can retrieve the right table, grain, filters, and gotchas before writing SQL.
3. `metrics/*.yaml`
   Approved metric packets with owner, grain, source, raw SQL SoT, verified dashboard/report SoT, validation rule, business context, and uncertainty policy.
4. `answer-paths/*.yaml`
   Recurring questions, route ids, trusted SQL or retrieval path, caveats, expected answer state, and validation routine.
