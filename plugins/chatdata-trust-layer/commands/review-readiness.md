---
description: Grade whether metrics, answer paths, patches, and proof are ready for review.
---

# Review Readiness

Use this command to produce a gstack-style readiness view for the trust layer.

First run `chatdata_doctor`, `chatdata_pull_context`, `chatdata_list_review_queue`, `chatdata_run_context_steward`, and a targeted bundle or context search for the workflow being reviewed. Keep the output compact; readiness is a verdict with blockers, not a file dump.

The summary should show:

- metrics with complete packets
- answer paths ready for human approval and later trusted use
- draft-only paths still relying on user benchmarks
- active drift or feedback incidents
- duplicate or conflicting definitions, sources, answer paths, or owner rules
- missing owner or benchmark coverage
- skeptical second-pass status for any path being called ready
- frame-trail coverage for exploratory answer paths: decision, anchors, disconfirming evidence, alternate frames, tripwires, and action implications
- open CDO pre-review or steward blockers that must be rewritten, merged, rejected, or published

Keep the output compact and operational.

If a path has not passed a current validation, benchmark, drift, eval, or frame-trail check, do not call it ready. Mark it `partially proved` or `not proved` and name the proof still missing.

Never call pending context trusted. A path becomes trusted only after it is approved/published and appears in `chatdata_pull_context` without `include_drafts`.

If readiness creates a reusable correction or de-dupe decision, run or recommend `/chatdata:sync-context` before closing.
