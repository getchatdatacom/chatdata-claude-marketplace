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
2. `chatdata_prepare_metric_answer`
3. approved metric packet or semantic layer selected by the prepared route
4. reviewed answer path
5. trusted artifact, benchmark, proof receipt, or eval
6. source reference and customer business context
7. raw SQL fallback only after the trusted route cannot answer and an `answered` prepared route allows the source read

The route planner never executes the source. Stop on `clarification_needed`, `needs_analyst_review`, `source_mismatch`, or `refused` and follow the returned repair path.

For exploratory questions, require the sensemaking loop before broad SQL:

- start with the decision the answer supports
- identify 3-4 grounded anchors from approved context or actual observed data
- propose 2-3 possible frames
- use narrow queries or artifact checks to test the frames
- name disconfirming evidence, what the kept frame still cannot explain, and the tripwires that should reopen the analysis

If the customer owns a trust-layer repo, also read `skills/customer-analytics-skill.md` and the relevant `sources/*.md` reference before querying.

Required output:

- direct answer or one clarifying question
- source route used
- validation or tie-out performed
- frame, anchors, alternate frames, and disconfirming evidence when exploratory
- confidence and uncertainty footer
- context gap to save, if any
- next ChatData write or proof command
