---
description: Audit ChatData context health before trusting a design-partner workflow.
---

# Audit Context

Use this command before a design-partner demo, stakeholder-facing answer, or trust-layer publish.

Keep this command concise. Its job is to prove whether the current workspace context can be trusted, not to print every metric or file. Show counts, current risks, and the next repair. Only include a full inventory when the user explicitly asks for it.

First use the ChatData MCP server and run `chatdata_doctor`.

- If the tool is unavailable, stop and say: "ChatData MCP is not connected. Install or repair the MCP from ChatData Settings, restart Claude Code, then rerun `/chatdata:audit-context`."
- If `chatdata_doctor` reports config, consent, token, workspace, or hub errors, stop and show the exact failing check plus the next install or repair action.
- If the connected domain is not the intended customer workspace, stop. Do not audit one company's context for another company's workflow.
- If healthy, continue.

Then use the ChatData MCP server and run `chatdata_pull_context`.

- Confirm the latest approved context revision was pulled or explain why the command is falling back to cached context.
- Treat `pulled_count: 0` as "no changed files in this incremental pull" when `context_available` is true. Do not call the workspace empty unless `empty_workspace` is true or `cached_count` is 0.
- Do not call context current if the pull failed and no cache exists.

Then use the ChatData MCP server and run `chatdata_run_context_steward`.

- This is the first-class governance pass. It checks approved and pending workspace context for duplicate reusable artifacts before the audit verdict.
- If multiple people submitted the same decision, answer path, source reference, caveat, eval, or proof receipt, the steward should create a pending canonical merge proposal instead of silently adding another approved file.
- Treat generated merge proposals as human-review work. Do not publish them automatically.
- If the steward reports existing open merge proposals, include them in the review risk instead of creating duplicate cleanup instructions.

Then use the ChatData MCP server and run `chatdata_list_review_queue`.

- List pending patches that could change metric definitions, answer paths, benchmarks, owner rules, or proof receipts.
- Treat items marked `needs_rewrite` by CDO pre-review as quality blockers, not approval-ready work.
- List steward merge proposals as "human approval needed" with the proposed canonical path and matched source files when available.
- If a pending patch affects the workflow being audited, mark the workflow `needs review` until the patch is published or rejected.

Then use the ChatData MCP server and run `chatdata_export_bundle`.

- Check that exported metrics, answer paths, and proof receipts line up with the workflow the user wants to trust.
- Check for duplicate or conflicting metric ids, answer paths, owner rules, or source references. If two artifacts appear to govern the same recurring question and the steward did not generate a merge proposal, mark the workflow `partially proved` until one canonical path is chosen.
- If required context is missing, recommend the smallest MCP-backed repair: `chatdata_create_metric_card`, `chatdata_save_answer_path`, `chatdata_create_proof_receipt`, or a patch tool such as `chatdata_propose_patch`; each repair creates human-review work before it becomes trusted context.

Before returning a trusted verdict, run a compact analyst-quality pass:

- decision, metric, grain, period, and source are explicit
- owner and freshness rules are present
- source tie-out, validation rule, or proof receipt exists for the answer path being trusted
- caveats and known exclusions are visible to the next user
- any reusable correction has a sync path, patch, or proof receipt

Required output:

- MCP doctor status
- context revision and cache status
- steward run summary, including duplicate clusters and generated merge proposals
- review-queue risk, including CDO pre-review rewrite blockers
- exported bundle summary
- duplicate or conflict risk
- trust verdict: `proved`, `partially proved`, or `not proved`
- blocking gaps and the next repair command
