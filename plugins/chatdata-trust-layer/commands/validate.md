---
description: Validate SQL, charts, metric packets, and answers before stakeholders see them.
---

# Validate

Alias for the ChatData validation stack.

Run `chatdata_doctor`, pull context, then validate the requested answer or artifact against:

- metric definition
- grain and filters
- source of truth
- freshness
- joins and exclusions
- benchmark query or dashboard total
- caveats and owner review state

If the validation is incomplete, say what proof is missing and route to `/chatdata:build-benchmark`, `/chatdata:audit-context`, or `/chatdata:but-for-real`.
