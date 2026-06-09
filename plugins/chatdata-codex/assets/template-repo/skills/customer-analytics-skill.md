---
name: customer-analytics-skill
version: 0.1.0
owner: "[analytics owner]"
status: draft
---

# Customer Analytics Skill

This file turns the customer's warehouse and business context into a routing contract for ChatData. Keep it customer-owned. Update it when metric packets, source models, dashboards, or recurring analysis patterns change.

## When To Use

Use this file for warehouse, BI, metric, dashboard, SQL, KPI movement, funnel, retention, revenue, pipeline, or recurring operating questions for `[company]`.

Do not use it for plugin install, billing, account support, or general product questions with no analytics component.

## Mandatory Source Order

1. Approved metric packet in `metrics/`
2. Reviewed answer path in `answer-paths/`
3. Trusted SQL in `queries/trusted/`
4. Verified dashboard/report artifact in `artifacts/`
5. Source reference in `sources/`
6. Decision, playbook, owner, proof, or eval context
7. Raw SQL fallback, only after the approved layer is missing or fails validation

Do not skip the approved layer because the question needs a date range, cohort, segment, join, denominator, or driver decomposition. Those belong in metric packets, answer paths, or source references.

## Semantic Layer And Metric Packets

The approved metric layer is the default route for every numeric answer.

- Metric packet folder: `metrics/`
- Required fields: owner, grain, source, timezone, freshness, filters, exclusions, raw SQL SoT, verified dashboard/report SoT, validation rule, business context, caveats, uncertainty policy
- Current top metrics:
  - `[metric id]`: `[plain-English definition]`
  - `[metric id]`: `[plain-English definition]`

If a compiled semantic layer exists outside this repo, document how to load it:

- Runtime or tool: `[Cube, dbt Semantic Layer, MetricFlow, Looker, internal API, other]`
- Load command or MCP tool: `[command/tool]`
- Discovery command: `[how to list measures, dimensions, segments, filters, and date spine]`
- Compile or execute command: `[command/tool]`
- Result inspection: `[how to inspect generated SQL, query id, or compiled metric result]`
- Known limitations: `[coverage gaps]`

Do not call this complete until the agent can load the layer, discover the relevant metric objects, compile or execute the metric route, and name the fallback if the layer cannot answer.

## Entity Disambiguation

Fill in terms that create wrong answers.

- `[Seller/User/Customer/Account]` can mean: `[entity A]`, `[entity B]`, or `[entity C]`
- `[Contract/Order/Booking/Activation]` can mean: `[definition A]` or `[definition B]`
- `[Channel/Source/Segment]` differs across: `[table or dashboard A]` and `[table or dashboard B]`
- Canonical count key: `[id field]`
- Inflating or deprecated key: `[field to avoid]`

Ask one clarifying question when the user's wording maps to more than one approved entity.

## Date Windows, Timezone, And Freshness

- Default timezone: `[timezone]`
- "Last week": last complete calendar week unless specified otherwise
- "Last month": last complete calendar month unless specified otherwise
- Cohort maturation rules: `[7/14/21/28/42 day rules or not applicable]`
- Freshness lag: `[tables or dashboards that settle late]`
- Freshness proof: use the approved artifact freshness rule or `MAX(date)` from the trusted route

## Domain References

Use the source reference that owns the question.

- `[domain]` -> `sources/[domain].md`
  - Use for: `[questions]`
  - Key tables: `[tables]`
  - Dashboards/reports: `[links or artifact ids]`
  - Owner: `[owner]`
- `[domain]` -> `sources/[domain].md`
  - Use for: `[questions]`

## Out Of Scope

Surface data only and name the owner for:

- access requests
- data pipeline failures
- stale dashboard fixes
- dbt/model ownership changes
- pricing, product, or GTM decisions when the customer has not delegated decision rights
- row-level PII requests

For restricted fields, return SQL or a validation plan for the customer to run. Do not paste raw rows into chat or MCP context.

## Provenance Footer

Every answer must end with:

`Source: [metric packet | answer path | governed source | raw fallback] · Confidence: [high|medium|low] · Freshness: [date/rule] · Owner: [owner] · Review: [trusted|reviewed|needs_analyst_review] · Uncertainty: [interval|validation tolerance|not available]`

If a field is missing, say what is missing and create the smallest reviewed patch.

## Customer Gotchas

Add the one-line warnings a senior analyst would give before querying.

- Use `[field_x]`, not `[field_y]`, for `[metric]`.
- Exclude `[population]` unless the question asks for it.
- `[dashboard A]` and `[dashboard B]` use different grains.
- `[enum value]` is deprecated but still appears in historical rows.
- `[table]` settles late, so current-day reads are provisional.
