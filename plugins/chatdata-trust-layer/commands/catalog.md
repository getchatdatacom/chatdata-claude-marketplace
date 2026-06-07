---
description: Explain and use the AI-native data catalog that powers ChatData answers.
---

# Catalog

Use this command when the customer asks what is in the ChatData catalog, how to use it, or how the plugin connects to the portal.

The catalog is approved shared context, not a raw warehouse dump. It can include:

- metric definitions
- source references and owner maps
- answer paths for recurring questions
- proof receipts and benchmark notes
- caveats, decisions, playbooks, and evals
- pending patches waiting for review

## Sequence

1. Run `chatdata_doctor`, then `chatdata_pull_context`.
2. Run `chatdata_export_bundle` for a compact shared-state summary when available.
3. Use `chatdata_search_context` for specific metric, source, dashboard, owner, or recurring question terms.
4. If the user wants the portal view, send them to `https://getchatdata.com/app/catalog`.
5. If catalog entries are missing, route to:
   - `/chatdata:onboarding` for the first top-10-metric setup
   - `/chatdata:metrics` for one metric
   - `/chatdata:connect-data` for source inventory
   - `/chatdata:sync-context` to save reusable context
   - `/chatdata:publish-patch` to approve a pending update

Required output:

- catalog status
- context families found
- how to inspect entries in the portal
- next command

