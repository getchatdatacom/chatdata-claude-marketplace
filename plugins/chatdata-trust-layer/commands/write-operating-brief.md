---
description: Write a concise operating brief from trusted ChatData context and evidence.
---

# Write Operating Brief

Use this command when the user wants a principal-level operating brief from trusted ChatData context.

Preferred flow:

1. Run `chatdata_doctor`, then `chatdata_pull_context`. Stop on MCP, workspace, consent, or domain mismatch errors.
2. Confirm the time window and operating decision the brief should support.
3. Review only the recent metric packets, trusted artifacts, answer paths, proof receipts, and drift or feedback incidents that affect that decision.
4. Write a short operating brief in plain language with:
   - what changed
   - what matters
   - what is noisy or still uncertain
   - what decision or follow-up should happen next
5. If the brief introduces reusable context, owner caveats, or a recurring answer path, run or recommend `/chatdata:sync-context` before treating it as future memory.

Required output:

- title
- 3 to 5 key findings
- trust and caveat notes
- recommended next steps
- synced artifact, patch, or proof needed
