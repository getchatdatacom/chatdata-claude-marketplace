---
description: Plan and record the sources, dashboards, dbt artifacts, and owners ChatData should trust.
---

# Connect Data

Use this command when a customer asks how to connect data sources or what ChatData needs before it can answer safely.

ChatData starts with trusted metadata and reviewed context. Do not ask for raw warehouse credentials unless the user explicitly chooses a governed access mode.

Collect or inspect:

- top metrics
- source systems
- blessed dashboards
- verified dashboard or saved-report SoTs used for eval loops
- owner-approved raw SQL SoTs, query files, or BI-generated SQL when present
- dbt or semantic-layer artifacts
- owner map
- business context: company type, revenue model, key segments, operating cadence, and expected metric behavior
- freshness and caveats
- recurring questions
- sensitive or excluded data boundaries

Save the reusable source inventory with `/chatdata:sync-context` or propose a patch. For local repo setup, route to `/chatdata:scan-sources` or `/chatdata:context-bootstrap`.
