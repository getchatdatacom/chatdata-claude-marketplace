---
description: Pull ChatData context and save reviewed metric, answer-path, proof, or patch updates through MCP.
---

# Sync Context

Use this command when a design partner has new or corrected context that should become reusable ChatData trust-layer state.

Use this after any analysis that created reusable definitions, caveats, validation checks, proof receipts, or answer paths. A useful correction that stays only in the chat transcript has not been synced.

First use the ChatData MCP server and run `chatdata_doctor`.

- If the tool is unavailable, stop and say: "ChatData MCP is not connected. Install or repair the MCP from ChatData Settings, restart Claude Code, then rerun `/chatdata:sync-context`."
- If `chatdata_doctor` reports config, consent, token, workspace, or hub errors, stop and show the exact failing check plus the next install or repair action.
- If the connected domain is not the intended customer workspace, stop. Do not sync artifacts into the wrong workspace.
- If healthy, continue.

Then use the ChatData MCP server and run `chatdata_pull_context`.

- Use the pulled context as the base state.
- Treat `pulled_count` as the latest delta only. If `context_available` is true, use `file_count` or `cached_count` as the real available-context count.
- Do not write new trust artifacts from memory alone. Cite the source file, owner note, benchmark, dashboard link, or user-provided evidence behind each change.
- Before writing, search existing context for the same metric id, answer path, source, or recurring question. Update the canonical artifact or propose a merge patch instead of creating a duplicate.

Choose the smallest MCP write for the update:

- Use `chatdata_create_metric_card` for a new or corrected metric definition, owner, grain, freshness rule, caveat, or validation rule.
- Use `chatdata_save_answer_path` for a reviewed recurring question, canonical route, SQL or retrieval path, validation check, caveat, and reuse rule.
- Use `chatdata_create_proof_receipt` for install proof, design-partner workflow proof, benchmark tie-out proof, or first trusted answer proof.
- Use a patch tool such as `chatdata_propose_patch` when an existing markdown artifact needs review before publication.

After writing, use the ChatData MCP server and run `chatdata_list_review_queue`.

- If the write created a pending patch, report the patch id and next review step.
- If the write created an accepted structured artifact, report the artifact id or path and the context revision if available.
- Keep output compact. Report created artifacts, evidence, and pending-review count; do not print a full context inventory unless the user asks.

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
