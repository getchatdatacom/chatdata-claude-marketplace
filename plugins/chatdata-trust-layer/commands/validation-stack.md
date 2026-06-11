---
description: Apply the full ChatData validation stack to an answer, WBR, proof, or packet.
---

# Validation Stack

Use this when the user wants the stricter validation checklist, not just a quick plausibility check.

Run the `/chatdata:validate` workflow, then add a second-pass verdict:

- `proved`
- `partially proved`
- `not proved`

For any numeric answer, require an uncertainty check before the verdict:

- Use a statistical confidence interval only when the analysis has a valid variance or sampling model.
- Use a validation interval when the number is a deterministic dashboard, semantic-layer, or trusted-artifact tie-out.
- Use owner-approved raw SQL SoT as the preferred verification path when it exists.
- Compare against customer-supplied verified dashboards or saved reports before promoting an answer to trusted.
- For exploratory answers, require the frame trail before the verdict: decision, grounded anchors, candidate frames, disconfirming evidence, alternate-frame test, committed frame or downgrade, tripwires, and action implications.
- Run a business-context check against company type, revenue model, segment logic, operating cadence, and expected metric behavior.
- Mark interval `not available` and downgrade when sample size, denominator, data quality, or benchmark proof is missing.
- Do not use `high confidence` as a substitute for an interval, bound, or explicit uncertainty statement.

For reusable or stakeholder-facing work, finish with `/chatdata:but-for-real`. If the frame trail is missing, return `partially proved` or `not proved` even when the arithmetic checks pass.
