---
description: Inspect, create, or repair metric trust packets.
---

# Metrics

Use this command when the user wants to define, inspect, repair, or compare metrics.

Run `chatdata_doctor`, `chatdata_pull_context`, then search for the metric name, synonyms, source model, dashboard, and owner. If the metric exists, summarize its owner, grain, source, caveats, freshness, validation, and review state. If it is missing or incomplete, route to `/chatdata:draft-metric-packet`.

Do not invent a metric definition. Mark missing owner, grain, source, denominator, or caveat fields as open review questions.

Required next commands:

- `/chatdata:draft-metric-packet` for a missing metric
- `/chatdata:build-benchmark` when validation is missing
- `/chatdata:sync-context` when a reusable correction should be saved
