---
id: "[domain]-source-reference"
type: source
review_state: draft
owner: "[data owner]"
domain: "[domain]"
template: true
---

# [Domain] Source Reference

## Quick Reference

### Business Context

[What this domain means in plain language and which decisions it supports.]

### Entity Grain

[What one row represents. Name the canonical id and the ids that inflate counts.]

### Standard Hygiene Filter

[Filters that every query in this domain applies. Name exclusions and exceptions.]

## Dimensions

- `[dimension]`: [definition, valid values, deprecated aliases, and where it appears]
- `[dimension]`: [definition, valid values, deprecated aliases, and where it appears]

## Key Tables

### `[schema.table]`

- Grain: `[row grain]`
- Scope/exclusions: `[scope]`
- Use for: `[questions this table owns]`
- Do not use for: `[adjacent questions]`
- Join keys: `[keys]`
- Required filters: `[filters]`
- Freshness: `[settlement rule or max-date field]`
- Owner: `[owner/team]`

### `[schema.table]`

- Grain: `[row grain]`
- Scope/exclusions: `[scope]`
- Use for: `[questions this table owns]`
- Do not use for: `[adjacent questions]`
- Join keys: `[keys]`
- Required filters: `[filters]`
- Freshness: `[settlement rule or max-date field]`
- Owner: `[owner/team]`

## Trusted Dashboards And Reports

- `[dashboard/report id]`: `[URL or artifact path]`
  - Owns: `[metric/question]`
  - Tie-out tolerance: `[rule]`
  - Caveats: `[caveats]`

## Gotchas

- [Wrong-answer mode and the exact rule that prevents it.]
- [Field naming trap and the correct field.]
- [Grain mismatch and how to avoid it.]

## Common Query Patterns

- [Default date window, segment cut, denominator, or decomposition pattern.]
- [Fallback route when the primary source lacks coverage.]

## Cross-References

- Metric packets: `metrics/[metric].yaml`
- Answer paths: `answer-paths/[answer-path].yaml`
- Trusted SQL: `queries/trusted/[query].sql`
- Related source references: `sources/[neighbor-domain].md`
