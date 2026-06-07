---
description: Record a ChatData proof receipt for an install, trusted answer, benchmark, or workflow.
---

# Proof

Use this command to record evidence that a ChatData workflow worked, failed, or needs review. Common proofs include install success, first trusted answer, benchmark tie-out, context sync, review queue cleanup, and design-partner demo readiness.

Proof receipts should be short and reusable. Record the claim, evidence, result, confidence, and remaining risk. Do not paste long inventories or raw files unless the proof depends on that exact excerpt.

First use the ChatData MCP server and run `chatdata_doctor`.

- If the tool is unavailable, stop and say: "ChatData MCP is not connected. Install or repair the MCP from ChatData Settings, restart Claude Code, then rerun `/chatdata:proof`."
- If `chatdata_doctor` reports config, consent, token, workspace, or hub errors, stop and show the exact failing check plus the next install or repair action.
- If the connected domain is not the intended customer workspace, stop. Do not record proof against the wrong workspace.
- If healthy, continue.

Then use the ChatData MCP server and run `chatdata_pull_context`.

- Use current pulled context when linking the proof to a metric, answer path, bundle, or patch.
- Treat `pulled_count` as the changed-file count for this pull only. If `context_available` is true, the cache has approved context even when `pulled_count` is 0.
- If pull fails but cached context exists, record the proof only if the user-facing claim does not depend on fresh hub state. Name the cache limitation in the proof.

Build a proof receipt with the facts the user supplied or the command observed:

- workflow name
- question or task
- evidence checked
- result: `passed`, `failed`, or `needs_review`
- confidence
- time saved, if known
- linked metric, answer path, patch id, or bundle revision when available
- failure mode or remaining risk

Then use the ChatData MCP server and run `chatdata_create_proof_receipt`.

- If the proof shows a recurring answer path is now reviewed, consider `chatdata_save_answer_path` only when the approved path, owner, validation, and caveats are explicit.
- If the proof exposes missing or stale context, propose the smallest repair through `chatdata_create_metric_card`, `chatdata_save_answer_path`, or a patch tool such as `chatdata_propose_patch`.
- If the proof depends on a corrected reusable definition or answer path, sync that artifact first or mark the proof `needs_review`.

After recording, use the ChatData MCP server and run `chatdata_list_review_queue`.

Required output:

- MCP doctor status
- context pull status
- proof receipt id or path
- result and confidence
- evidence checked
- pending review count
- remaining risk or next command
