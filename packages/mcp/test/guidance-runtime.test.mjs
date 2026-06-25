import assert from "node:assert/strict";
import test from "node:test";

import { extractTrustReceiptFields } from "../dist/guidance.js";

test("proof receipt extraction omits multiline CSV rows before compacting whitespace", () => {
  const receipt = extractTrustReceiptFields({
    path: "proof/validation-sample.md",
    content: `# Validation sample

## Validation

account_id,week,revenue
a1,2026-06-01,100
a2,2026-06-01,110
a3,2026-06-01,120
a4,2026-06-01,130
a5,2026-06-01,140
`
  });

  assert.equal(receipt.metadata_only, true);
  assert.equal(receipt.raw_rows_included, false);
  assert.equal(receipt.trust_fields.validation, "[omitted: row-level content]");
});

test("proof receipt extraction omits JSON row arrays", () => {
  const receipt = extractTrustReceiptFields({
    path: "proof/json-row-array.md",
    content: `# JSON row sample

validation: [{"id":1,"value":10},{"id":2,"value":20},{"id":3,"value":30},{"id":4,"value":40},{"id":5,"value":50}]
`
  });

  assert.equal(receipt.metadata_only, true);
  assert.equal(receipt.raw_rows_included, false);
  assert.equal(receipt.trust_fields.validation, "[omitted: row-level content]");
});
