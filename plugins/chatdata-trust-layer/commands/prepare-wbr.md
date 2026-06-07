---
description: Prepare a weekly business review from approved metrics, evidence, and caveats.
---

# Prepare WBR

Use this command when a founder, operator, or data lead wants the weekly business review prepared from the trust-layer repo.

Preferred flow:

1. Run `chatdata_doctor`, then `chatdata_pull_context`. Stop on MCP, workspace, consent, or domain mismatch errors.
2. Confirm the reporting period and the business review scope.
3. Search or read only the metrics, answer paths, proof receipts, and caveats relevant to the review. Do not print the full context inventory.
4. Tie each headline movement to the approved definition, grain, freshness rule, and strongest proof available.
5. Draft a compact WBR prep note with:
   - biggest metric movements
   - drivers already supported by trusted evidence
   - unresolved questions that still need review
   - follow-ups to assign before the meeting
6. If the WBR creates reusable corrections, new recurring questions, or owner-reviewed caveats, run or recommend `/chatdata:sync-context`.

Required output:

- WBR headline summary
- metric movement bullets
- unresolved risks
- recommended follow-up owners
- sync or proof needed before reuse
