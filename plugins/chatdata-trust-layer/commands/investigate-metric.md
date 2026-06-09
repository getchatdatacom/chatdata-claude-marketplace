---
description: Investigate a KPI movement with trusted metric definitions, evidence, caveats, and proof.
---

# Investigate Metric

Use this command when one operator wants a principal-level read on a KPI movement or recurring business question inside Claude Code.

Preferred flow:

1. Run `chatdata_doctor`, then `chatdata_pull_context`. Stop on MCP, workspace, consent, or domain mismatch errors.
2. Frame the question: decision, metric, grain, reporting period, segment, source of truth, owner, and hypothesis. Ask only for missing details that materially change the answer.
3. Use the built-in `warehouse-query` skill for source routing. Search or read the approved metric packet or semantic layer, matching answer path, trusted SQL, verified dashboard/report SoT, source reference, customer analytics skill, business-context packet, proof receipt, and eval before writing analysis.
4. If owner-approved raw SQL exists, use it as the verification route before generating new SQL. If generated SQL is still needed, compare it against the raw SQL SoT and explain any difference.
5. If a query, dashboard, or source artifact is used, tie the result back to the approved definition and expected range. Stop or downgrade if the foundational metric does not match.
6. Compare the result against the customer's business model, operating cadence, segment logic, and known metric behavior. Downgrade if the answer is numerically plausible but business-implausible.
7. Run a skeptical second pass before assigning the trust label:
   - re-check the answer against the metric packet and trusted artifact
   - check arithmetic, filters, joins, grain, freshness, and caveats
   - confirm raw SQL SoT and verified dashboard/report tie-outs when present
   - confirm the business-context check does not contradict the answer
   - attach a confidence interval or uncertainty bound for each numeric estimate
   - distinguish statistical confidence intervals from deterministic dashboard validation tolerances
   - name the strongest way the answer could still be wrong
   - downgrade to needs review if benchmark, freshness, or owner coverage is incomplete
8. Produce a concise investigation with:
   - direct answer
   - trust state
   - confidence interval or uncertainty statement
   - evidence used
   - business-context check
   - caveats
   - recommended next step
9. If the analysis created a reusable definition, caveat, proof, validation rule, or answer path, run or recommend `/chatdata:sync-context`. If it should be trusted for future users, follow with `/chatdata:proof` or `/chatdata:audit-context`.

Required output:

- one-sentence answer
- confidence interval or uncertainty statement for every numeric claim
- evidence list
- raw SQL SoT or verified dashboard/report tie-out used, if present
- business-context check
- provenance footer: source, confidence, freshness, owner, review state, uncertainty
- trust label
- skeptical second-pass note
- caveats
- synced artifact, patch, or proof needed
- next command or follow-up
