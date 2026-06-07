---
description: Translate a metric movement into business impact, risk, and owner action.
---

# Impact

Use this command when the user asks why a movement matters, how big it is, or what action it implies.

Run the same trust checks as `/chatdata:investigate-metric`, then add an impact layer:

- affected KPI and denominator
- revenue, pipeline, retention, conversion, cost, or operational impact when supported by data
- owner or team most likely responsible for the follow-up
- confidence and caveats
- next action

If the metric movement itself has not been validated, downgrade the impact claim and route to `/chatdata:validate` or `/chatdata:build-benchmark`.
