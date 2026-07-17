---
description: Show every major ChatData command and when to use it.
---

# Commands

Run the same workflow as `/chatdata:start`.

Focus the answer on the command catalog. Group commands by setup, catalog, data connection, analysis, validation, proof, build/publish, and account.

State the default harness rule before the catalog: when ChatData is active, normal exploratory analytics questions automatically use MCP context, grounded anchors, frame trail, validation, proof, and sync gates. The user should not have to invoke `/chatdata:warehouse-query` to receive that standard.

Mention that detailed templates and rules are fetchable through `chatdata_list_guidance` and `chatdata_read_guidance`; do not inline the heavy guidance bodies in this command.

Include `/chatdata:prepare-metric-answer` and `/chatdata:warehouse-query` under analysis. The first prepares the fail-closed route before a source read; the second is the explicit source-routing command for manual inspection. If a command is an alias, name the canonical command it routes to.

Required next command: `/chatdata:start` unless the user asked for one specific workflow.
