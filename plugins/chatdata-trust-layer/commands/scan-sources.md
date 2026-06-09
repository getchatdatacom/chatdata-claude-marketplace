---
description: Scan dbt, dashboards, docs, owner maps, and source metadata for trusted context.
---

# Scan Sources

Use this command to inspect the local trust-layer repo plus the customer's dbt artifacts, dashboard exports, and owner mapping.

Checklist:

1. Identify the top recurring metrics already named in dashboards or docs.
2. List trusted dashboard links, benchmark SQL candidates, and owner gaps.
3. Draft or update `sources/<domain>.md` references with grain, scope, required filters, join keys, freshness, dashboards, and gotchas.
4. Update `skills/customer-analytics-skill.md` with entity disambiguation, date-window conventions, out-of-scope routing, and the provenance footer.
5. Call out weak or missing metadata without blocking the whole install.
6. Leave the user with a short source-readiness summary for the top-10-metric wedge.

Prefer concrete files, folders, and missing fields over strategy prose.
