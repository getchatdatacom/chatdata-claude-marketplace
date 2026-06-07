---
description: Draft a metric trust packet with owner, grain, source, caveats, and validation.
---

# Draft Metric Packet

Use this command when one metric needs to move from loose tribal knowledge into a concrete trust packet.

Workflow:

1. Run `chatdata_doctor`, then `chatdata_pull_context`. Search existing context for the same metric id, synonym, source model, and recurring question before drafting.
2. Start from the canonical metric template in `metrics/`.
3. Pull the best available definition from dashboard labels, dbt docs, trusted SQL, and owner notes.
4. Fill owners, grain, timezone, caveats, freshness, validation rules, clarification rules, and escalation rules.
5. Include the expected source tie-out: blessed dashboard/model/query, acceptable tolerance, and known exclusions.
6. Keep uncertain fields explicit instead of inventing confidence.
7. Save the packet as a draft or proposed patch through MCP and list the open review questions.

Required output:

- metric packet path
- fields completed
- fields still missing
- duplicate check result
- benchmark path recommendation
