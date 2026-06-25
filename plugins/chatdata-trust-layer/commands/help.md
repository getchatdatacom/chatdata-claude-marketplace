---
description: Show ChatData setup status, command map, and the next useful command.
---

# Help

Use this command when the user is new, unsure which ChatData command to run, or blocked by setup.

Keep the answer compact, but do not hide the breadth of the plugin. This is the command router and feature map.

First try to use the ChatData MCP server and run `chatdata_doctor`.

- If the tool is unavailable, say: "ChatData plugin is installed, but ChatData MCP is not connected. Go to ChatData Settings, copy the terminal setup command, run it, restart Claude Code, then rerun `/chatdata:help`."
- If `chatdata_doctor` reports a config, consent, token, workspace, or hub error, show the failing check and the next repair action.
- If healthy, report the workspace domain and say MCP is connected.

Default harness rule: when ChatData is active, exploratory analytics questions automatically use MCP context, grounded anchors, frame trail, validation, proof, and sync gates. Users should not need to invoke `/chatdata:warehouse-query` to get that behavior. Treat `/chatdata:warehouse-query` as the explicit source-routing command for manual warehouse, BI, dashboard, SQL, or recurring KPI inspection.

If the user needs detailed metric packet, answer path, proof receipt, CDO review, warehouse-query, pilot security, or setup troubleshooting guidance, use `chatdata_list_guidance` and `chatdata_read_guidance` through MCP instead of expanding that guidance in this help output.

Then show the command map:

- Start and setup: `/chatdata:start`, `/chatdata:login`, `/chatdata:status`, `/chatdata:update`, `/chatdata:onboarding`, `/chatdata:settings`
- Catalog and context: `/chatdata:catalog`, `/chatdata:metrics`, `/chatdata:sync-context`, `/chatdata:audit-context`, `/chatdata:publish-patch`
- Data connection: `/chatdata:connect-data`, `/chatdata:scan-sources`, `/chatdata:context-bootstrap`, `/chatdata:company-repo`
- Analysis: `/chatdata:question-framing`, `/chatdata:warehouse-query`, `/chatdata:investigate`, `/chatdata:investigate-metric`, `/chatdata:prepare-wbr`, `/chatdata:write-operating-brief`, `/chatdata:story-and-action`
- Trust and validation: `/chatdata:validate`, `/chatdata:validation-stack`, `/chatdata:benchmark`, `/chatdata:build-benchmark`, `/chatdata:but-for-real`
- Memory and proof: `/chatdata:proof`, `/chatdata:proof-receipts`, `/chatdata:feedback-memory`, `/chatdata:drift-check`, `/chatdata:review-readiness`
- Build and publish: `/chatdata:bootstrap-repo`, `/chatdata:draft-metric-packet`, `/chatdata:generate-evals`, `/chatdata:create-evals`, `/chatdata:publish-patch`
- Account: `/chatdata:license`, `/chatdata:trial-and-privacy`, `/chatdata:activate-session`

If approved context already exists in MCP, route first-session setup to `/chatdata:onboarding` so existing metrics, answer paths, source references, decisions, playbooks, evals, and proof receipts become the directional setup map. Do not ask users to repeat context the workspace already knows.

If the user asks for a command that is not available in this installed plugin, do not pretend it exists. Route to the closest available command and name the missing command plainly.

Required output:

- one-line ChatData purpose
- MCP status
- workspace/domain if available
- command choices grouped by job
- the single next command to run
- support route: `support@getchatdata.com`
