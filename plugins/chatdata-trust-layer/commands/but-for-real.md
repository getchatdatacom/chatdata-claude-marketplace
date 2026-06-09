---
description: Run a skeptical proof pass before calling ChatData work ready or trusted.
---

# But For Real

Use this command after ChatData drafts, edits, publishes, or claims a trust-layer result is ready.

This is the anti-victory-lap pass. It should force a skeptical second read before saying "done", "ready", "trusted", "fixed", "published", or "this should work".

Sequence:

1. Re-open the files, packets, answer paths, scripts, context bundle, or proof artifact that the claim depends on.
2. Name the most likely way the change could still fail in production or in front of a design partner.
3. Run the smallest useful verification:
   - metric packet validation
   - benchmark query or dashboard tie-out check
   - recurring-question eval
   - drift check
   - context publish dry run
   - package check
   - focused unit or integration test
4. Compare the proof to the claim. If the proof only covers part of the claim, downgrade the verdict.
5. Return the result using the required output shape.

Required output:

- verdict: `proved`, `partially proved`, or `not proved`
- proof checked
- likely failure still possible
- smallest next fix or verification step

Do not present confidence as evidence. The proof has to be visible.
