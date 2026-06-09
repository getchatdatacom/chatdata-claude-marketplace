---
description: Start ChatData and show the full feature catalog for Claude Code.
---

# Start

Use this command when a customer types `/chatdata` or asks what ChatData can do.

This is the customer-facing feature map. Do not hide the breadth of the plugin. First check whether setup is healthy, then show the command catalog grouped by job.

## Sequence

1. Try to use the ChatData MCP server and run `chatdata_doctor`.
   - If MCP is unavailable, say ChatData is installed but MCP is not connected, then route to ChatData Settings and `/chatdata:login`.
   - If the doctor reports config, consent, token, workspace, or hub errors, show the failing check and one repair action.
   - If healthy, show the workspace domain and say approved context can be pulled from the ChatData catalog.

2. If MCP is healthy, run `chatdata_pull_context`.
   - If approved context exists, mention the rough families available: metrics, sources, answer paths, evidence, playbooks, decisions, evals, and proof receipts.
   - If the workspace is blank, route to `/chatdata:onboarding`.

3. Show the full command catalog:

- Setup: `/chatdata:login`, `/chatdata:status`, `/chatdata:update`, `/chatdata:onboarding`, `/chatdata:settings`
- Catalog: `/chatdata:catalog`, `/chatdata:metrics`, `/chatdata:sync-context`, `/chatdata:audit-context`, `/chatdata:publish-patch`
- Data connection: `/chatdata:connect-data`, `/chatdata:scan-sources`, `/chatdata:context-bootstrap`, `/chatdata:company-repo`
- Analysis: `/chatdata:question-framing`, `/chatdata:warehouse-query`, `/chatdata:investigate`, `/chatdata:investigate-metric`, `/chatdata:prepare-wbr`, `/chatdata:write-operating-brief`, `/chatdata:story-and-action`
- Trust and validation: `/chatdata:validate`, `/chatdata:validation-stack`, `/chatdata:benchmark`, `/chatdata:build-benchmark`, `/chatdata:but-for-real`
- Memory and proof: `/chatdata:proof`, `/chatdata:proof-receipts`, `/chatdata:feedback-memory`, `/chatdata:drift-check`, `/chatdata:review-readiness`
- Build and publish: `/chatdata:bootstrap-repo`, `/chatdata:draft-metric-packet`, `/chatdata:generate-evals`, `/chatdata:create-evals`, `/chatdata:publish-patch`
- Account: `/chatdata:license`, `/chatdata:trial-and-privacy`, `/chatdata:activate-session`

4. End with the single best next command for the current state.

## Required Output

- one-line ChatData purpose
- workspace and MCP status
- catalog state: approved context, blank workspace, or blocked
- grouped command catalog
- best next command
- support route: `support@getchatdata.com`
