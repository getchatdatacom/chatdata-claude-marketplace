---
description: Activate a Claude session by checking MCP, pulling context, and choosing the next workflow.
---

# Activate Session

Use this at the start of a new Claude Code session.

Run:

1. `chatdata_doctor`
2. `chatdata_pull_context`
3. `chatdata_list_review_queue`

Then report:

- workspace domain
- context count or blank-workspace state
- pending review risk
- best next command

Route blank workspaces to `/chatdata:onboarding`; healthy recurring-analysis sessions to `/chatdata:start`, `/chatdata:investigate-metric`, or `/chatdata:prepare-wbr`.
