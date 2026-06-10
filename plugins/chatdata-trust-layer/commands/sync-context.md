---
description: Pull ChatData context and save reviewed metric, answer-path, proof, or patch updates through MCP.
---

# Sync Context

Use this command when a design partner has new or corrected context that should become reusable ChatData trust-layer state.

Use this after any analysis that created reusable definitions, frames, tripwires, caveats, validation checks, proof receipts, or answer paths. A useful correction that stays only in the chat transcript has not been synced.

First use the ChatData MCP server and run `chatdata_doctor`.

- If the tool is unavailable, stop and say: "ChatData MCP is not connected. Install or repair the MCP from ChatData Settings, restart Claude Code, then rerun `/chatdata:sync-context`."
- If `chatdata_doctor` reports config, consent, token, workspace, or hub errors, stop and show the exact failing check plus the next install or repair action.
- If the connected domain is not the intended customer workspace, stop. Do not sync artifacts into the wrong workspace.
- If healthy, continue.

Then use the ChatData MCP server and run `chatdata_pull_context`.

- Use the pulled context as the base state.
- Treat `pulled_count` as the latest delta only. If `context_available` is true, use `file_count` or `cached_count` as the real available-context count.
- Do not write new trust artifacts from memory alone. Cite the source file, owner note, raw SQL SoT, verified dashboard/report link, benchmark, business-context note, or user-provided evidence behind each change.
- Before writing, search existing context for the same metric id, answer path, source, or recurring question. Update the canonical artifact or propose a merge patch instead of creating a duplicate.

Choose the smallest MCP write for the update:

- Use `chatdata_create_metric_card` only for an actual metric card: count, rate, amount, or status definition with grain, owner, source, raw SQL SoT or verified dashboard/report SoT when present, freshness rule, caveat, business-context note, and validation rule.
- Do not use metric cards for playbooks, routing rules, attribution decision logic, source stacks, evals, decisions, or answer paths. Use `chatdata_save_answer_path` for recurring questions and routes; use `chatdata_propose_patch` under `playbooks/`, `sources/`, `evals/`, or `decisions/` for broader shared guidance.
- Use `chatdata_save_answer_path` to submit a recurring question, canonical route, SQL or retrieval path, raw SQL SoT usage, verified dashboard/report tie-out, business-context check, frame, tripwires, validation check, caveat, and reuse rule to human review.
- Use `chatdata_create_proof_receipt` to submit install proof, design-partner workflow proof, benchmark tie-out proof, first trusted answer proof, or frame-stress-test proof to human review.
- Use a patch tool such as `chatdata_propose_patch` when an existing markdown artifact needs review before publication.

After writing, use the ChatData MCP server and run `chatdata_list_review_queue`.

- Report the `cdo_pre_review` decision, score, and required rewrites from the write response when present.
- If the CDO pre-review marked the item `needs_rewrite`, do not tell the user it is ready for approval; report the rewrite blocker first.
- If the write created a pending patch, report the patch id and next review step.
- If the write created a structured review item, report the artifact path, patch id, CDO pre-review result, and next review step.
- Keep output compact. Report created artifacts, evidence, and pending-review count; do not print a full context inventory unless the user asks.

Then use the ChatData MCP server and run `chatdata_run_context_steward`.

- This is mandatory after context writes. It catches duplicate metrics, duplicate answer paths, duplicate decisions, duplicate sources, and pending-only merge candidates before anything becomes trusted.
- Report merge proposals as human-review work with patch ids. Do not publish them automatically.

Then recommend or run the next proof step:

- Use `/chatdata:audit-context` when the saved context changes a trusted workflow.
- Use `/chatdata:proof` when the sync itself or a validated answer should be recorded.

Required output:

- MCP doctor status
- context pull status
- artifacts created or patches proposed
- evidence behind each write
- duplicate check result
- pending review count
- next command: `/chatdata:audit-context` or `/chatdata:proof`
