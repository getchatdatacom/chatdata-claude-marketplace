---
description: Investigate a KPI movement with trusted metric definitions, evidence, caveats, and proof.
---

# Investigate Metric

Use this command when one operator wants a principal-level read on a KPI movement or recurring business question inside Claude Code.

Preferred flow:

1. Run `chatdata_doctor`, then call `chatdata_prepare_metric_answer` with the exact question and expected workspace domain. Stop on MCP, workspace, consent, domain mismatch, unresolved correction, structural failure, or refusal states. The planner must return `plan_only: true` and `source_executed: false`.
2. Frame the question: decision, metric, grain, reporting period, segment, source of truth, owner, and trust standard. Ask only for missing details that materially change the answer.
3. Use the built-in `warehouse-query` skill for the approved source route. Follow the context selected by `chatdata_prepare_metric_answer` before reading the live source; do not silently replace its source, correction, validation, or refusal decision.
4. Build the exploratory frame before broad SQL:
   - start from the user decision, not the table list
   - identify 3-4 grounded anchors from actual data, dashboards, answer paths, or source references
   - propose 2-3 possible frames and state what each would explain
   - choose the smallest query or artifact check that can test the frame
5. If owner-approved raw SQL exists, use it as the verification route before generating new SQL. If generated SQL is still needed, compare it against the raw SQL SoT and explain any difference.
6. If a query, dashboard, or source artifact is used, tie the result back to the approved definition and expected range. Stop or downgrade if the foundational metric does not match.
7. Stress-test the frame:
   - name evidence that supports the frame
   - name disconfirming evidence, anomalies, or source mismatches
   - compare at least one alternate frame when evidence is mixed
   - say what the chosen frame still does not explain
8. Compare the result against the customer's business model, operating cadence, segment logic, and known metric behavior. Downgrade if the answer is numerically plausible but business-implausible.
9. Commit, reframe, or downgrade:
   - commit only when the frame holds with stated confidence and direct evidence
   - reframe when disconfirming evidence breaks the original explanation
   - downgrade to `needs_analyst_review` when the frame cannot explain a serious anomaly
   - name tripwires that should reopen the analysis after new data arrives
10. Run a skeptical second pass before assigning the trust label:
   - re-check the answer against the metric packet and trusted artifact
   - check arithmetic, filters, joins, grain, freshness, and caveats
   - confirm raw SQL SoT and verified dashboard/report tie-outs when present
   - confirm the business-context check does not contradict the answer
   - attach a confidence interval or uncertainty bound for each numeric estimate
   - distinguish statistical confidence intervals from deterministic dashboard validation tolerances
   - name the strongest way the answer could still be wrong
   - downgrade to needs review if benchmark, freshness, or owner coverage is incomplete
11. Produce a concise investigation with:
   - direct answer
   - trust state
   - confidence interval or uncertainty statement
   - committed frame or alternate frames still in contention
   - grounded anchors
   - disconfirming evidence and what the frame cannot explain
   - evidence used
   - business-context check
   - caveats
   - recommended next step
12. Bind proof and any reusable answer path to the returned `route_id` and `investigation_id`. Submit reviewed outcome feedback through `chatdata_submit_answer_feedback`; negative feedback creates review work and never edits approved context automatically.

Required output:

- one-sentence answer
- confidence interval or uncertainty statement for every numeric claim
- committed frame, grounded anchors, alternate frames considered, and disconfirming evidence
- evidence list
- raw SQL SoT or verified dashboard/report tie-out used, if present
- business-context check
- provenance footer: source, confidence, freshness, owner, review state, uncertainty
- trust label
- skeptical second-pass note
- tripwires that should reopen the analysis
- caveats
- synced artifact, patch, or proof needed
- next command or follow-up
