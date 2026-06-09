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
- business-context fit
- freshness
- joins and exclusions
- confidence interval, validation interval, or explicit uncertainty state
- benchmark query, raw SQL SoT, verified dashboard total, or saved-report total
- caveats and owner review state

If the validation is incomplete, say what proof is missing and route to `/chatdata:build-benchmark`, `/chatdata:audit-context`, or `/chatdata:but-for-real`.

Do not accept `high confidence` as enough for numeric claims. Use a statistical confidence interval only when there is a valid variance or sampling model. Use a validation interval for deterministic dashboard or semantic-layer tie-outs. Mark interval `not available` when denominator, sample size, data quality, or benchmark proof is missing.
