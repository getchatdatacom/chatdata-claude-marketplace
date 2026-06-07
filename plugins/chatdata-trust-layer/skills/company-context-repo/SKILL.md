---
name: company-context-repo
description: Enforce ChatData's MCP-backed shared workspace context for team or company analytics work.
---

# Company Context

Use this skill whenever the user mentions a company, team rollout, shared data context, GitHub repo, catalog, Slack rollout, WBR, recurring metrics, or work that multiple people will reuse.

ChatData's default stance: serious data analysis should not stay single-player. Company work needs MCP-backed shared workspace context that everyone on the company analytics workflow can read and improve.

## Enforcement

Before company or team analysis:

1. Run `chatdata_doctor`.
2. Pull approved context with `chatdata_pull_context`.

If MCP is configured and context is available, continue without ceremony.

If MCP is missing or points at the wrong workspace, stop the analysis and send the user to ChatData Settings for the terminal setup command. A customer-owned GitHub repo can still be used only as an explicit fallback or debug surface.

## Read Before Work

Before raw discovery, inspect MCP context:

- `metrics/`
- `answer-paths/`
- `corrections/`
- `sources/`
- `decisions/`
- `playbooks/`
- `evals/`

Use this shared context ahead of private chat history, one-off notebooks, or guessed metric definitions.

## Write Back

After useful work, propose updates to shared context:

- metric packet for a new or corrected metric
- answer path for a recurring question
- correction file for a mistake, caveat, rejected definition, or gotcha
- proof receipt for material work
- decision note for WBR or executive-review output
- eval case for a question that should not regress

Prefer a visible pending patch for changes that affect other users. Do not silently overwrite reviewed context.

## Sync After Work

After every useful analysis or reusable context write, refresh context as its own step:

Use `chatdata_pull_context` to read the latest approved state and the smallest relevant write tool to save reusable context.

Treat a healthy MCP write or pending patch as the successful end state. If sync is blocked, report the exact blocker before presenting the work as team-ready.

## Output Rule

Tell the user where reusable context was read from, what was written back, and whether MCP sync succeeded. Keep customer-facing output ChatData-branded.
