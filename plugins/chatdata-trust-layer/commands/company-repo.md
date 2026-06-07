---
description: Compatibility route for legacy company-repo setup; prefer MCP-backed shared context.
---

# Company Repo

Use this command only as a compatibility route for older ChatData instructions that mention a company repo.

Current ChatData setup is MCP-backed shared workspace context. A customer-owned repo can still be useful for source files, metric packets, SQL, evals, and Slack bundle publishing, but it is not required for the status line or first onboarding.

Sequence:

1. Run `chatdata_doctor` and `chatdata_pull_context`.
2. If MCP is healthy, route shared setup to `/chatdata:onboarding` and `/chatdata:catalog`.
3. If the customer wants a repo, route to `/chatdata:bootstrap-repo`.
4. If the user is seeing `repo:missing`, treat it as stale status-line cache and route to `/chatdata:update`.
