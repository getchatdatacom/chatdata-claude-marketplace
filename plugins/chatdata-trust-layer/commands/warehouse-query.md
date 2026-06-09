---
description: Route warehouse, KPI, dashboard, SQL, and recurring analytics questions through the approved ChatData trust layer.
---

# Warehouse Query

Use this command when a customer asks a warehouse, BI, metric, KPI, dashboard, SQL, funnel, retention, revenue, or recurring analytics question.

Invoke the built-in plugin skill:

`/chatdata:warehouse-query`

The skill lives at `skills/warehouse-query/SKILL.md` inside the installed plugin.

Then follow its source order:

1. `chatdata_doctor`
2. `chatdata_pull_context`
3. approved metric packet or semantic layer
4. reviewed answer path
5. trusted artifact, benchmark, proof receipt, or eval
6. source reference and customer business context
7. raw SQL fallback only after the trusted route cannot answer

If the customer owns a trust-layer repo, also read `skills/customer-analytics-skill.md` and the relevant `sources/*.md` reference before querying.

Required output:

- direct answer or one clarifying question
- source route used
- validation or tie-out performed
- confidence and uncertainty footer
- context gap to save, if any
- next ChatData write or proof command
