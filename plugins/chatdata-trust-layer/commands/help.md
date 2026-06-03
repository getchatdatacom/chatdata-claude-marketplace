---
description: Show ChatData setup status, command map, and the next useful command.
---

# Help

Use this command when the user is new, unsure which ChatData command to run, or blocked by setup.

Keep the answer compact. This is the command router, not the full manual.

First try to use the ChatData MCP server and run `chatdata_doctor`.

- If the tool is unavailable, say: "ChatData plugin is installed, but ChatData MCP is not connected. Go to ChatData Settings, copy the terminal setup command, run it, restart Claude Code, then rerun `/chatdata:help`."
- If `chatdata_doctor` reports a config, consent, token, workspace, or hub error, show the failing check and the next repair action.
- If healthy, report the workspace domain and say MCP is connected.

Then show the smallest command map:

- Setup or repair: `/chatdata:help`, `/chatdata:status`
- First session: `/chatdata:onboarding` if available, otherwise `/chatdata:status`
- Ask a metric question: `/chatdata:investigate-metric`
- Review trusted context: `/chatdata:audit-context`
- Save reusable context: `/chatdata:sync-context`
- Record proof: `/chatdata:proof`
- Final verification: `/chatdata:but-for-real`

If the user asks for a command that is not available in this installed plugin, do not pretend it exists. Route to the closest available command and name the missing command plainly.

Required output:

- one-line ChatData purpose
- MCP status
- workspace/domain if available
- 5-7 command choices grouped by job
- the single next command to run
- support route: `support@getchatdata.com`
