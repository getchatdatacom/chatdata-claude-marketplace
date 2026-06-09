---
description: Publish one reviewed ChatData pending patch through the MCP hub.
---

# Publish Patch

Use this command only after the user has reviewed and approved a pending ChatData patch.

First use the ChatData MCP server and run `chatdata_doctor`.

- If the tool is unavailable, stop and say: "ChatData MCP is not connected. Install or repair the MCP from ChatData Settings, then rerun `/chatdata:publish-patch`."
- If `chatdata_doctor` reports config, consent, or hub errors, stop and show the exact failing check plus the next install/repair command.
- If healthy, continue.

Then use the ChatData MCP server and run `chatdata_list_review_queue`.

- If the user supplied a patch id, find that exact patch and summarize the path, type, owner, and content preview before publishing.
- If the user did not supply a patch id, list the pending patches and ask which one to publish. Do not guess.
- If there are no pending patches, say the review queue is empty and stop.
- If the patch has `cdo_pre_review` or review-state metadata showing `needs_rewrite`, missing owner, missing source, missing validation, taxonomy mismatch, or blocked-sensitive content, do not publish. Rewrite or reject first.

Before publishing, use the ChatData MCP server and run `chatdata_run_context_steward`.

- Treat open duplicate, merge, or conflict proposals as blockers for the affected file.
- Do not publish a patch that would create overlapping metric, answer-path, source, decision, playbook, eval, or proof context until the steward proposal is resolved.

After explicit approval for a specific patch id, use the ChatData MCP server and run `chatdata_publish_patch` with that `patch_id`.

After publishing, run `chatdata_pull_context` and verify the published path appears in approved context. If the patch creates a canonical metric or answer path, recommend `/chatdata:audit-context` for the affected workflow.

Required output:

- MCP doctor status
- patch id
- path and review state before publishing
- publish result
- local cache refresh status
- next verification command: `/chatdata:audit-context`
