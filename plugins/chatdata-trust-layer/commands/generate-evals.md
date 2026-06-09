---
description: Generate recurring KPI eval questions from approved ChatData context.
---

# Generate Evals

Use this command to create recurring KPI eval questions for the active pilot domain.

First run `chatdata_doctor`, then `chatdata_pull_context`. Use approved metric packets, answer paths, caveats, raw SQL SoTs, verified dashboards/reports, business-context packets, and proof receipts as the source. If context is unavailable, stop and repair MCP before generating evals.

Requirements:

1. Generate questions the business actually asks in weekly review.
2. Tie each question to an expected route, metric, caveat, and accepted answer states.
3. Distinguish reviewed high-value paths from exploratory ones.
4. Prefer breadth of recurring phrasing over generic warehouse chat prompts.
5. Use raw SQL SoT as the expected verification route when owner-approved SQL is present.
6. Require at least one eval per metric that ties out to a verified dashboard, saved report, or other customer-supplied SoT.
7. Include business-context checks that catch answers that are numerically plausible but wrong for the customer's company type, revenue model, segment logic, or operating cadence.
8. Include adversarial variants that catch wrong grain, stale freshness, owner mismatch, duplicate metric ids, unsupported source selection, and overconfident answers without uncertainty.
9. Save or propose the eval set through MCP when it is meant to become reusable context.

Target:

- at least 30 recurring questions
- enough variation to catch routing drift
