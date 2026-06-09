---
description: Bootstrap shared workspace context from metrics, sources, owners, caveats, and answer paths.
---

# Context Bootstrap

Use this when a workspace has little or no approved context and needs the first reusable setup packet.

Start with `/chatdata:onboarding`. Then create or propose the smallest useful artifacts:

- top-10 metrics
- customer analytics skill: semantic layer path, entity disambiguation, date windows, freshness, out-of-scope rules, provenance footer
- source inventory
- source reference files for each governed domain or canonical dataset
- raw SQL SoTs when present
- verified dashboard/report SoTs for eval loops
- business-context packet for company type, revenue model, key segments, operating cadence, and expected metric behavior
- owner map
- first recurring answer paths
- caveats and freshness rules
- first proof receipt

If a customer-owned repo is available, use `/chatdata:bootstrap-repo`. If MCP context is available, write through MCP first so every Claude/Codex MCP user sees the same state.
