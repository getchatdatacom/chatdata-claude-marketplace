---
name: warehouse-query
version: 0.1.0
description: "IF the user asks a warehouse, BI, metric, KPI, dashboard, SQL, funnel, retention, revenue, or recurring analytics question through ChatData, THEN use this skill before querying or answering. DO NOT use for install, account, billing, plugin-update, or support questions with no analytics component."
---

# Warehouse Query

Use this skill as ChatData's default routing contract for analytics questions.

The job is to make Claude Code and Codex use the same trusted route: approved metric packets first, reviewed answer paths next, source references and owner context next, and raw exploration only when the approved layer cannot answer the question.

## Source Order

Run this order before writing SQL or answering:

1. `chatdata_doctor`
   Stop on MCP, workspace, consent, token, or domain mismatch errors.
2. `chatdata_pull_context`
   Use approved context as the working catalog. Treat pending patches as directional, not trusted.
3. approved metric packet or semantic layer
   Search `metrics/` first. If a compiled semantic layer exists in the customer context, use it before raw SQL. The metric packet must name owner, grain, source, freshness, raw SQL SoT when present, verified dashboard/report SoT when present, caveats, validation, business context, and uncertainty policy.
   Semantic-layer use means more than naming the layer: load the approved runtime or MCP tool, discover the approved measures, dimensions, segments, filters, and date spine, compile or execute the metric query through that layer, then inspect the generated SQL/result before falling back.
4. Reviewed answer path
   Search `answer-paths/` for the recurring question, route, SQL path, benchmark, caveat, and expected answer state.
5. Trusted artifacts and proof
   Search `artifacts/`, `proof/`, `evals/`, and benchmark notes for dashboard/report tie-outs, validated totals, proof receipts, and known failure modes.
6. Source references and business context
   Search `sources/`, `catalog/`, `decisions/`, `playbooks/`, and any customer-owned `skills/customer-analytics-skill.md`.
7. Raw SQL fallback
   Use raw SQL only after the approved metric or answer-path route is missing, stale, or fails validation. Name the fallback and save the reusable route back through MCP if it should recur.

## Do Not Bail Early

Do not skip the approved layer because the question:

- needs a date window, cohort, segment, market, channel, or device cut
- needs a join to owners, products, accounts, opportunities, regions, or campaigns
- names the metric differently than the packet title
- mentions a dashboard that uses the same metric under another label
- asks for a driver decomposition rather than a single number
- needs a denominator, sample size, or uncertainty bound

Search the approved metric packet, answer path, source reference, and customer analytics skill first. Ask one clarifying question only when two approved artifacts conflict or the requested decision changes the grain.

## Date Windows And Freshness

Decide these before querying:

- Use the customer's approved timezone when present. If none exists, ask or state the assumed timezone.
- Interpret "last week" and "last month" as the last complete calendar period unless the customer context says otherwise.
- Anchor freshness to the approved artifact's `freshness_rule`, the source reference, or `MAX(date)` from the trusted route. Do not assume "yesterday."
- For cohorts, use the approved maturation rule. If no rule exists, return a provisional answer and create a context gap.

## Business And Entity Checks

Before finalizing, resolve:

- the business decision the answer supports
- entity grain: user, account, company, lead, opportunity, session, contract, invoice, order, or event
- canonical population filters and exclusions
- owner and data steward
- current product names versus deprecated values still present in data
- whether the answer should surface data only or make an operating recommendation

If the customer-specific skill says a decision belongs to another team, surface the data and say who owns the decision. Do not author product, pricing, pipeline, or engineering changes unless the customer context explicitly permits it.

## Validation

Every stakeholder-facing numeric answer needs a validation pass:

- compare the result to the metric packet and answer path
- check joins, grain, filters, exclusions, denominator, and sample size
- tie out to raw SQL SoT or verified dashboard/report SoT when present
- run or request `/chatdata:validate`, `/chatdata:validation-stack`, or `/chatdata:but-for-real` when the answer will be reused
- downgrade to `needs_analyst_review` when owner, freshness, benchmark, or uncertainty proof is incomplete

For restricted fields or row-level personal data, return SQL or a validation plan for the customer to run. Do not paste raw rows into chat, proof receipts, local queues, or MCP context.

## Required Footer

End every analytics answer with a compact footer:

`Source: metric packet | answer path | governed source | raw fallback · Confidence: high|medium|low · Freshness: <date/rule> · Owner: <owner> · Review: <trusted|reviewed|needs_analyst_review> · Uncertainty: <interval|validation tolerance|not available>`

If any footer field is missing, name the missing context and recommend the smallest ChatData write:

- `chatdata_create_metric_card`
- `chatdata_save_answer_path`
- `chatdata_create_proof_receipt`
- `chatdata_propose_patch`

## Sync Rule

If the work teaches ChatData a reusable definition, caveat, source route, date convention, entity disambiguation, benchmark, or answer path, save it through MCP or propose a reviewed patch. A useful answer that stays only in chat is incomplete.
