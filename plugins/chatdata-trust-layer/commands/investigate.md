---
description: Investigate a KPI or business question using the trusted ChatData workflow.
---

# Investigate

Alias for `/chatdata:investigate-metric`.

Use this when the customer asks a business question such as "why did conversion drop?" or "which segment drove pipeline?"

Run the full metric investigation workflow by default: MCP doctor, context pull, approved context/source routing, decision framing, grounded anchors, candidate frames, disconfirming evidence, validation, caveats, tripwires, and sync/proof recommendation.

Use `/chatdata:warehouse-query` only when the user explicitly wants manual warehouse, BI, dashboard, SQL, or recurring metric source-routing inspection. The normal ChatData active harness should not require the user to invoke it first.
