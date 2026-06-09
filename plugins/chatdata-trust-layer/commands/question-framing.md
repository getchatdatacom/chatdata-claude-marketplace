---
description: Frame an analytics question before querying or answering.
---

# Question Framing

Use this before analysis when the question is vague, ambiguous, or likely to have multiple metric definitions.

Frame the request around:

- decision the answer supports
- metric and grain
- period and comparison
- segment, filter, or cohort
- source of truth
- owner and caveats
- trust standard needed: exploratory, reviewed, or stakeholder-ready

Then route to `/chatdata:investigate-metric`, `/chatdata:prepare-wbr`, or `/chatdata:metrics`.

If the question requires warehouse, BI, dashboard, SQL, or recurring KPI context, route to `/chatdata:warehouse-query` before analysis so the session checks metric packets, answer paths, source references, and provenance before raw SQL fallback.
