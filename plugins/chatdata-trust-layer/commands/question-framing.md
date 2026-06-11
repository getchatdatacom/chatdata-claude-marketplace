---
description: Frame an analytics question before querying or answering.
---

# Question Framing

Use this before analysis when the question is vague, ambiguous, exploratory, or likely to have multiple metric definitions or explanations.

Frame the request around:

- decision the answer supports
- metric and grain
- period and comparison
- segment, filter, or cohort
- source of truth
- owner and caveats
- trust standard needed: exploratory, reviewed, or stakeholder-ready

For exploratory mode, start with the business decision before SQL:

1. Identify 3-4 grounded anchors from approved data, dashboards, prior answer paths, or source references.
2. Propose 2-3 possible explanatory frames before choosing one.
3. Name what each frame should explain, what it would fail to explain, and the narrow query or artifact needed to test it.
4. Carry disconfirming evidence forward. Do not hide the anomalies that would break the frame.

Then route to `/chatdata:investigate-metric`, `/chatdata:prepare-wbr`, or `/chatdata:metrics`.

If the question requires warehouse, BI, dashboard, SQL, or recurring KPI context, apply the same source-routing harness by default: check metric packets, answer paths, source references, and provenance before raw SQL fallback. Use `/chatdata:warehouse-query` when the user explicitly asks for manual source routing or when the route itself needs inspection.
