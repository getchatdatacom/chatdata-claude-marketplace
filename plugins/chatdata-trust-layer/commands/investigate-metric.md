---
description: Investigate a KPI movement with trusted definitions, evidence, caveats, and proof.
---

# Investigate Metric

Use this command when one operator wants a principal-level read on a KPI movement or recurring business question inside Claude Code.

Preferred flow:

1. Run `chatdata_doctor`, then `chatdata_pull_context`. Stop on MCP, workspace, consent, or domain mismatch errors.
2. Frame the question: decision, metric, grain, reporting period, segment, source of truth, owner, and hypothesis. Ask only for missing details that materially change the answer.
3. Search or read the approved metric packet, source reference, proof receipt, and any matching answer paths before writing analysis.
4. If a query, dashboard, or source artifact is used, tie the result back to the approved definition and expected range. Stop or downgrade if the foundational metric does not match.
5. Run a skeptical second pass before assigning the trust label:
   - re-check the answer against the metric packet and trusted artifact
   - check arithmetic, filters, joins, grain, freshness, and caveats
   - name the strongest way the answer could still be wrong
   - downgrade to needs review if benchmark, freshness, or owner coverage is incomplete
6. Produce a concise investigation with:
   - direct answer
   - trust state
   - evidence used
   - caveats
   - recommended next step
7. If the analysis created a reusable definition, caveat, proof, validation rule, or answer path, run or recommend `/chatdata:sync-context`. If it should be trusted for future users, follow with `/chatdata:proof` or `/chatdata:audit-context`.

Required output:

- one-sentence answer
- evidence list
- trust label
- skeptical second-pass note
- caveats
- synced artifact, patch, or proof needed
- next command or follow-up
