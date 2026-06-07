---
description: Detect drift after dbt, dashboard, metric, answer-path, or feedback changes.
---

# Drift Check

Use this command after dbt changes, dashboard edits, or repeated Slack feedback incidents.

Tasks:

1. Run `chatdata_doctor`, then `chatdata_pull_context`.
2. Compare changed files, review-queue patches, and feedback incidents with the current metric packets and answer paths.
3. Flag any reviewed or auto-trusted paths that may need downgrade, merge, quarantine, or owner re-approval.
4. Check for duplicate definitions or answer paths created by the drift event.
5. Suggest the smallest repair set that restores trust.
6. Save the drift proof, proposed patch, or review-readiness update through MCP when the result should become reusable.
