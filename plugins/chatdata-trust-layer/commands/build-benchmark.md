---
description: Build a trusted SQL, dashboard, or artifact benchmark for a metric.
---

# Build Benchmark

Use this command when a trusted SQL path or dashboard benchmark is missing for a metric.

Sequence:

1. Run `chatdata_doctor`, then `chatdata_pull_context`.
2. Look for an existing benchmark query, proof receipt, or approved answer path for the metric.
3. If absent, draft a candidate benchmark query under `queries/generated/`.
4. Link the benchmark back to the metric packet and answer path.
5. Run a skeptical second pass against the proposed benchmark:
   - does it match the metric grain, filters, exclusions, and freshness rules?
   - can it be tied out to a dashboard or trusted artifact?
   - does it duplicate or conflict with an existing metric, owner rule, source, or path?
   - what production or design-partner failure would it miss?
6. Record what still needs analyst review before the path can be promoted beyond draft.
7. Save a proof receipt or proposed patch through MCP if the benchmark should become reusable.

Do not present generated SQL as trusted until it has a visible review path.
