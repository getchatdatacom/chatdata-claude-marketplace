---
description: Run the shared ChatData onboarding flow and turn setup learnings into MCP context for every user.
---

# Onboarding

Use this command for a first customer session, a new teammate joining an existing workspace, or a design-partner setup pass.

This is not a single-player setup checklist. The job is to use existing MCP context as the directional map, fill the missing trust-layer gaps, and save reusable onboarding knowledge back through MCP so every ChatData plugin user and Slack surface can pull the same state.

## Core Rule

If approved context already exists in the MCP workspace, use it directionally.

That means:

- Start from existing approved metrics, answer paths, sources, decisions, playbooks, evals, and proof receipts.
- Pre-fill what the workspace already knows instead of asking the user to repeat it.
- Ask only for missing or conflicting owner, source, grain, caveat, benchmark, and scope details.
- Treat pending patches as directional but not approved.
- Do not overwrite existing context silently. Update the canonical artifact or propose a reviewed merge patch.
- If the existing context belongs to the wrong workspace or domain, stop before onboarding.

## Sequence

1. Use the ChatData MCP server and run `chatdata_doctor`.
   - If the tool is unavailable, stop and say: "ChatData MCP is not connected. Install or repair MCP from ChatData Settings, restart Claude Code, then rerun `/chatdata:onboarding`."
   - If `chatdata_doctor` reports config, consent, token, workspace, or hub errors, stop and show the failing check plus the next repair action.
   - If the connected domain is not the intended customer workspace, stop. Do not onboard one company's context into another company's workspace.

2. Use the ChatData MCP server and run `chatdata_pull_context`.
   - Treat `pulled_count: 0` as "no changed files in this pull" when `context_available` is true.
   - If `context_available` is true, say onboarding is starting from shared context and use it directionally.
   - If `empty_workspace` is true or `cached_count` is 0, say onboarding is starting from a blank shared workspace and needs the first top-10-metric packet.

3. Use the ChatData MCP server and run `chatdata_list_review_queue`.
   - Pending onboarding, metric, source, answer-path, decision, playbook, or proof patches should shape the questions, but do not call them approved.
   - If a pending patch conflicts with the user's new input, propose a merge or ask for owner review.

4. Use targeted MCP search or export:
   - Prefer `chatdata_export_bundle` when you need a compact shared-state summary.
   - Use `chatdata_search_context` for specific terms such as metric names, dashboard names, owners, source systems, or recurring questions.
   - Use `chatdata_read_context_file` only for the files that affect the current onboarding decision.
   - Do not dump the full inventory unless the user asks.

5. Determine the onboarding state:
   - `directional`: approved context exists and should guide setup.
   - `partial`: some metrics or sources exist but key owners, caveats, benchmarks, or answer paths are missing.
   - `blank`: no shared approved context exists yet.
   - `blocked`: MCP, domain, consent, source access, or owner review prevents safe progress.

6. Ask the smallest useful onboarding question.
   - For blank workspaces: "Which 10 metrics must always return the same answer?"
   - For directional workspaces: ask for the highest-value missing detail, such as the owner for one metric, the blessed dashboard, the benchmark query, or the recurring question to save first.
   - For conflicting workspaces: ask which existing artifact is canonical, then propose a patch rather than creating a duplicate.

7. Save the reusable result through MCP.
   - Use `chatdata_create_metric_card` for a reviewed metric definition, owner, grain, source, freshness, caveat, or validation rule.
   - Use `chatdata_save_answer_path` for a reviewed recurring question and route.
   - Use `chatdata_create_proof_receipt` for install proof, onboarding proof, first trusted answer proof, or benchmark proof.
   - Use `chatdata_propose_patch` when the onboarding result needs owner review or touches broader shared guidance.

8. When a local trust-layer repo is available, create shared onboarding patches:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/bin/onboarding_packet.py" <trust-layer-repo> --workspace "<workspace domain>" --pilot-domain "<pilot domain>" --owner "<owner email>" --include-markdown
```

Review the returned patches, then propose them with `chatdata_propose_patch`. These patches create shared onboarding context under:

- `onboarding/shared-onboarding-packet.md`
- `sources/onboarding-source-inventory.md`
- `decisions/onboarding-scope.md`
- `playbooks/onboarding-sync-loop.md`

9. End with a proof-oriented close:
   - report what existing MCP context guided the session
   - report what new shared artifact or pending patch was created
   - report what remains local-only, if anything
   - recommend `/chatdata:audit-context` or `/chatdata:proof` before calling the onboarding result trusted

## Required Output

- MCP doctor status
- context state: `directional`, `partial`, `blank`, or `blocked`
- existing shared context used directionally
- pending-review risk
- one missing input or decision needed now
- shared artifact created or pending patch proposed
- next command: `/chatdata:audit-context`, `/chatdata:proof`, `/chatdata:sync-context`, or `/chatdata:publish-patch`

Do not end by saying the user is "set up" when useful onboarding knowledge is still only in the chat transcript or a local file. Shared setup is complete only when the reusable context is saved, proposed for review, or explicitly marked blocked.
