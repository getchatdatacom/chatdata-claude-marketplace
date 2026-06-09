---
description: Save customer corrections, preferred wording, source choices, or caveats into shared context.
---

# Feedback Memory

Use this when a user corrects an answer, names the right metric, rejects a source, clarifies a caveat, or gives a preferred communication style.

Sequence:

1. Run `chatdata_doctor` and `chatdata_pull_context`.
2. Identify whether the feedback changes a metric, answer path, source, caveat, playbook, or communication preference.
3. Search for existing related context.
4. Save the smallest durable update:
   - `chatdata_create_metric_card`
   - `chatdata_save_answer_path`
   - `chatdata_create_proof_receipt`
   - `chatdata_propose_patch`
5. If the correction affects a trusted answer, recommend `/chatdata:audit-context`.

Do not leave durable customer feedback only in the chat transcript.
