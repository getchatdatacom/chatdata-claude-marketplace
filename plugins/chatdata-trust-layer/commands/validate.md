---
description: Validate SQL, charts, metric packets, and answers before stakeholders see them.
---

# Validate

Alias for the ChatData validation stack.

Run `chatdata_doctor`, pull context, then validate the requested answer or artifact against:

- metric definition
- customer analytics skill and source reference
- grain and filters
- source of truth
- raw SQL SoT when present
- verified dashboard or saved-report SoT
- exploratory frame trail: decision, grounded anchors, candidate frames, disconfirming evidence, alternate-frame test, committed frame or downgrade, tripwires, and action implications
- business-context fit
- freshness
- joins and exclusions
- confidence interval, validation interval, or explicit uncertainty state
- benchmark query, raw SQL SoT, verified dashboard total, or saved-report total
- caveats and owner review state

If the validation is incomplete, say what proof is missing and route to `/chatdata:build-benchmark`, `/chatdata:audit-context`, or `/chatdata:but-for-real`.

Do not accept `high confidence` as enough for numeric claims. Use a statistical confidence interval only when there is a valid variance or sampling model. Use a validation interval for deterministic dashboard or semantic-layer tie-outs. Mark interval `not available` when denominator, sample size, data quality, or benchmark proof is missing.

Do not accept an exploratory answer as validated when the frame trail is missing. Mark it `partially proved` or `needs_analyst_review` until the answer names the anchors, disconfirming evidence, alternate frames tested, and tripwires.
