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

Pending patches are review-queue work, not approved catalog context. Use them directionally only after clearly labeling them pending.

## Sequence

1. Run `chatdata_doctor`, then `chatdata_pull_context`.
2. Run `chatdata_export_bundle` for a compact approved shared-state summary when available.
3. Run `chatdata_list_review_queue` only to report pending-review risk separately from approved catalog contents.
4. Use `chatdata_search_context` for specific metric, source, dashboard, owner, or recurring question terms.
5. If the user wants the portal view, send them to `https://getchatdata.com/app/catalog`.
6. If catalog entries are missing, route to:
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
