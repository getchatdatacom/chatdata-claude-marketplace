---
description: Prepare a fail-closed metric route before any direct source read.
---

# Prepare Metric Answer

Use this before querying PostHog, warehouse, BI, spreadsheet, or file tools for a KPI, funnel, revenue, retention, conversion, activation, or usage question.

1. Run `chatdata_doctor` if MCP state is unknown.
2. Call `chatdata_prepare_metric_answer` with the exact question, expected workspace domain, and `source_hint` when the user named a dashboard, model, file, or source.
3. Show the selected context and why each item was selected, discounted, or excluded.
4. Do not read the live source unless the route returns `answer_state: answered`, `plan_only: true`, and `source_executed: false`.
5. If the route returns `clarification_needed`, `needs_analyst_review`, `source_mismatch`, or `refused`, stop and follow its repair path. Stale approved context and unresolved source hints are blocking conditions.
6. After the source read, run validation in dependency order and create a proof receipt bound to the returned `route_id` and `investigation_id`.
7. For recurring reviewed work, save the answer path. Submit reviewed feedback with `chatdata_submit_answer_feedback`.

Required output:

- answer state
- route id and investigation id
- selected context with rationale
- source-match, freshness, and correction status
- validation plan
- model recommendation, never an automatic model switch
- explicit note that the planner did not execute the source
- next action
