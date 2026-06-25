import { createHash } from "node:crypto";

export type GuidanceKind = "template" | "skill" | "rule" | "runbook";
export type AgentSurface = "claude-code" | "codex" | "generic";

export interface GuidanceListItem {
  id: string;
  kind: GuidanceKind;
  title: string;
  description: string;
  version: string;
  recommended_when: string[];
  content_hash: string;
}

export interface GuidanceReadResult extends GuidanceListItem {
  markdown: string;
}

interface GuidanceRecord extends Omit<GuidanceReadResult, "content_hash"> {}

export interface TrustReceiptSummary {
  path: string;
  type: "metric" | "answer_path" | "proof_receipt" | "trusted_artifact";
  title: string | null;
  content_hash: string;
  metadata_only: true;
  raw_rows_included: false;
  source_references: string[];
  trust_fields: {
    review_state: string | null;
    owner: string | null;
    metric_id: string | null;
    answer_state: string | null;
    source: string | null;
    freshness: string | null;
    validation: string | null;
    caveats: string | null;
    current_frame: string | null;
    anchors: string[];
    disconfirming_evidence: string | null;
    action_implications: string | null;
    uncertainty: string | null;
  };
  evidence_checklist: {
    source_reference: boolean;
    freshness: boolean;
    validation: boolean;
    caveats: boolean;
    frame_or_decision: boolean;
    disconfirming_evidence: boolean;
    action_implications: boolean;
  };
}

const guidanceRecords: GuidanceRecord[] = [
  {
    id: "metric-packet-template",
    kind: "template",
    title: "Metric Packet Template",
    description: "Owner-reviewed metric definition fields for count, rate, amount, and status metrics.",
    version: "2026-06-13",
    recommended_when: [
      "Creating or repairing an approved metric card",
      "Converting loose KPI language into an owner-reviewed metric packet"
    ],
    markdown: `# Metric Packet Template

Use this when a metric needs a reusable contract before an agent answers with it.

Required fields:

- id:
- title:
- owner:
- definition:
- grain:
- filters:
- exclusions:
- source:
- raw_sql_sot:
- verified_dashboard_sot:
- verified_report_sot:
- freshness:
- validation:
- business_context:
- caveats:
- uncertainty_policy:
- review_state:

Review bar:

- The definition names the denominator when the metric is a rate.
- The grain and filters are explicit enough for another analyst to reproduce.
- Source references point to approved metadata, dashboards, saved SQL, or dbt artifacts.
- Caveats say when not to use the metric.
- The packet does not include raw rows, secrets, or credentials.`
  },
  {
    id: "answer-path-template",
    kind: "template",
    title: "Answer Path Template",
    description: "Reusable path for answering a recurring business question with frame, evidence, and caveats.",
    version: "2026-06-13",
    recommended_when: [
      "Saving a repeatable route from question to trusted answer",
      "Making a WBR, KPI diagnostic, or executive readout reproducible"
    ],
    markdown: `# Answer Path Template

Use this after the analysis route is stable enough to reuse.

Required fields:

- id:
- title:
- owner:
- metric_id:
- answer_state:
- decision:
- current_frame:
- anchors:
- source:
- sql_or_retrieval_path:
- raw_sql_sot:
- verified_dashboard_sot:
- verified_report_sot:
- freshness:
- validation:
- business_context_check:
- frame_explains:
- frame_cannot_explain:
- alternate_frames:
- disconfirming_evidence:
- caveats:
- tripwires:
- action_implications:
- reuse_rule:

Review bar:

- The path starts from the decision or recurring question.
- It states which frame won and what evidence would change it.
- It names disconfirming evidence or explicitly says none was found.
- It keeps raw row outputs out of the artifact.
- It is specific enough for Claude Code or Codex to reuse without re-inventing the route.`
  },
  {
    id: "proof-receipt-template",
    kind: "template",
    title: "Proof Receipt Template",
    description: "Structured receipt for a trusted answer, install, benchmark, or workflow proof.",
    version: "2026-06-13",
    recommended_when: [
      "Closing out an answer that needs proof",
      "Recording an install, benchmark, or customer workflow verification"
    ],
    markdown: `# Proof Receipt Template

Use this to make the evidence trail reusable without storing raw rows.

Required fields:

- id:
- title:
- summary:
- owner:
- metric_id:
- answer_state:
- source:
- evidence_checked:
- raw_sql_sot:
- verified_dashboard_sot:
- verified_report_sot:
- freshness:
- validation:
- business_context_check:
- current_frame:
- anchors:
- disconfirming_evidence:
- caveats:
- uncertainty:
- action_implications:
- next_action:

Review bar:

- The receipt explains what was checked and what passed.
- The source references are enough for a reviewer to find the artifact.
- The answer state is explicit: answered, clarification_needed, needs_analyst_review, or refused.
- Numeric answers have a confidence interval, validation interval, or explicit not available uncertainty state.
- Exploratory answers include anchors, disconfirming evidence, alternate frames, tripwires, and action implications.
- Any caveats, failed checks, or remaining risks are clear.
- Raw rows, customer secrets, and credential-like values are not included.`
  },
  {
    id: "business-metric-preflight",
    kind: "rule",
    title: "Business Metric Preflight",
    description: "Use ChatData context before direct source tools for KPI, traffic, funnel, revenue, retention, conversion, activation, and usage questions.",
    version: "2026-06-25",
    recommended_when: [
      "Before answering a business metric from PostHog, warehouse, BI, spreadsheet, or file data",
      "When a metric term could have a canonical definition, caveat, owner, source of truth, or saved answer path"
    ],
    markdown: `# Business Metric Preflight

Failure mode: an agent can query a live source, return a number, and skip the approved metric definition, caveat, proof receipt, or reusable answer path.

Enforced route:

1. Run chatdata_doctor if connection state is unknown.
2. Run chatdata_pull_context.
3. Search or read ChatData context for the metric, source, saved answer path, proof receipt, caveat, or guidance.
4. If approved context exists, use it to define the metric before querying PostHog, warehouse, BI, spreadsheet, or file tools.
5. If approved context is missing or ambiguous, say so and use clarification_needed or needs_analyst_review instead of silently choosing a definition.
6. Query the live source for the current value only after the context pass.
7. If the result is reusable, record the session context, proof receipt, metric card, or answer path through the smallest MCP write tool.

The Claude Code plugin is required for Claude Code customers and can wrap this route with commands and hooks, but the rule belongs in MCP so Codex and other MCP-only clients inherit it.`
  },
  {
    id: "reliability-contract",
    kind: "rule",
    title: "Reliability Contract",
    description: "Gate for answer-state correctness, evidence paths, proof receipts, and reusable answer paths.",
    version: "2026-06-17",
    recommended_when: [
      "Before calling an answer trusted, reliable, reusable, or ready",
      "When a Codex MCP-only client needs the same reliability bar as the Claude plugin"
    ],
    markdown: `# Reliability Contract

Reliable means the same approved context produces the same answer state, evidence path, caveats, and uncertainty state. If ChatData cannot prove the answer, it should downgrade visibly.

Answer states:

- answered: validation passed and evidence is enough.
- clarification_needed: the question is answerable but scope remains ambiguous.
- needs_analyst_review: the route is plausible but not proven against approved logic.
- refused: the request is unsafe, out of scope, or asks for action under unresolved ambiguity.

Required before trust:

- Pull current context with chatdata_doctor and chatdata_pull_context.
- For business-metric questions, use ChatData to resolve the canonical definition, caveats, source, proof, or saved answer path before querying live source tools.
- Use targeted reads for the metric, source, answer path, proof receipt, caveat, or eval.
- Bind the answer to approved metric packets, raw SQL SoTs, verified dashboards or reports, saved answer paths, or prior proof receipts.
- Include source path, freshness, validation result, caveats, business-context check, and reviewer state when available.
- For numeric answers, include a confidence interval, validation interval, or explicit not available uncertainty state.
- For exploratory answers, include decision, grounded anchors, disconfirming evidence, alternate frames, tripwires, and action implications.
- Record proof with chatdata_create_proof_receipt before calling the result trusted or reusable.

Reliability failures:

- quietly wrong answer
- missing answer state
- source or dashboard mismatch
- unsupported high-confidence numeric answer
- missing caveat, uncertainty interval, or validation tolerance
- exploratory answer with no disconfirming evidence or tripwire
- saved answer path without proof or review state
- claim that ChatData checked a source it could not access`
  },
  {
    id: "cdo-review-rules",
    kind: "rule",
    title: "CDO Review Rules",
    description: "Pre-review checks before a patch becomes approved ChatData context.",
    version: "2026-06-13",
    recommended_when: [
      "Before publishing metric, answer-path, proof, or catalog context",
      "When deciding whether a local patch belongs in the review queue"
    ],
    markdown: `# CDO Review Rules

Do not approve context until these checks pass.

Checks:

- Ownership: the artifact has an owner or the missing owner is explicitly marked.
- Metric contract: definitions, grain, filters, exclusions, and caveats are explicit.
- Source contract: source references point to approved metadata, dashboards, saved SQL, or dbt artifacts.
- Frame contract: answer paths and proof receipts include anchors, caveats, and disconfirming evidence.
- Freshness: date or refresh policy is stated.
- Security: no raw rows, secrets, credentials, personal inbox routes, or unrestricted connection strings.
- Review state: drafts stay pending until a human owner accepts, rejects, or rewrites them.

If any check fails, keep the artifact in review and return the smallest repair request.`
  },
  {
    id: "warehouse-query-route",
    kind: "skill",
    title: "Warehouse Query Route",
    description: "Route exploratory warehouse questions through scoped source references and proof receipts.",
    version: "2026-06-13",
    recommended_when: [
      "A question needs warehouse inspection or SQL",
      "The user asks for a trusted answer that might depend on source routing"
    ],
    markdown: `# Warehouse Query Route

ChatData does not need a canvas to answer. It needs a trusted route.

Route:

1. Restate the decision and candidate frame.
2. Search approved metric packets, answer paths, and proof receipts first. For business metrics, this happens before PostHog, warehouse, BI, spreadsheet, or file queries unless the user explicitly asked for a raw source check.
3. If warehouse access is available, use only the connection and permissions granted by the host environment.
4. Prefer reviewed SQL, dashboard references, dbt metadata, and saved query paths before new SQL.
5. Validate the result against at least one independent anchor when possible.
6. Record the proof receipt with source references, freshness, validation, caveats, and action implications.

Security language:

- Say scoped or reviewed, not sandboxed.
- Do not imply ChatData isolates arbitrary shell commands.
- Do not store raw rows in local proof artifacts.`
  },
  {
    id: "pilot-security-posture",
    kind: "rule",
    title: "Pilot Security Posture",
    description: "Plain-language posture for pilots and design partners.",
    version: "2026-06-13",
    recommended_when: [
      "Explaining local state, MCP permissions, or customer pilot safety",
      "Reviewing setup docs, install guides, or privacy copy"
    ],
    markdown: `# Pilot Security Posture

Use precise language.

Accurate:

- ChatData stores config and approved metadata locally under ~/.chatdata.
- The MCP server reads and writes approved ChatData context, local queue files, and derived proof metadata.
- Customer data posture is metadata-first: metric definitions, answer paths, proof receipts, source references, evals, review state, and local cache metadata.
- Host agents, shell commands, and connected warehouses run with the permissions the user grants.

Do not claim:

- OS sandboxing.
- Isolation of arbitrary subprocesses.
- That ChatData prevents the host agent from using permissions the user granted elsewhere.

Use instead:

- scoped metadata cache
- reviewed answer path
- approved proof receipt
- metadata-only artifact export`
  },
  {
    id: "setup-troubleshooting",
    kind: "runbook",
    title: "Setup Troubleshooting",
    description: "Thin setup checks for Claude Code plugin plus MCP and Codex MCP-only installs.",
    version: "2026-06-13",
    recommended_when: [
      "Claude Code or Codex cannot see ChatData tools",
      "A user pasted raw config JSON instead of the terminal setup command"
    ],
    markdown: `# Setup Troubleshooting

Active surfaces:

- Claude Code: required ChatData plugin plus ChatData MCP.
- Codex: ChatData MCP only.

Checks:

1. Verify ~/.chatdata/config.json exists and is valid JSON.
2. Build packages/mcp and confirm dist/index.js exists.
3. Claude Code: run claude plugin list and claude mcp get chatdata.
4. Codex: run codex mcp get chatdata.
5. Ask the agent to run chatdata_doctor with the expected workspace domain.

Common failure:

- If Terminal says zsh: command not found: token:, the user pasted raw Client config JSON. Send them back to Settings to copy the terminal setup command or surface-aware setup prompt.`
  }
];

export function listGuidance(kind?: GuidanceKind | "all"): GuidanceListItem[] {
  const normalizedKind = kind === "all" ? undefined : kind;

  return guidanceRecords
    .filter((record) => !normalizedKind || record.kind === normalizedKind)
    .map(toListItem);
}

export function readGuidance(id: string): GuidanceReadResult | null {
  const record = guidanceRecords.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  return {
    ...toListItem(record),
    markdown: record.markdown
  };
}

export function renderAgentContext(surface: AgentSurface = "generic"): string {
  const surfaceLine = surface === "claude-code"
    ? "Surface: Claude Code. Use the required ChatData plugin plus the ChatData MCP server."
    : surface === "codex"
      ? "Surface: Codex. Use the ChatData MCP server only; do not describe /chatdata: commands as Codex commands."
      : "Surface: generic agent. Prefer MCP tools when available, then route users to the active Claude Code or Codex setup path.";

  const setupLine = surface === "claude-code"
    ? "Start with /chatdata:status, /chatdata:onboarding, and /chatdata:start after the MCP server is connected."
    : surface === "codex"
      ? "Start by running chatdata_doctor, chatdata_pull_context, and chatdata_agent_context through MCP."
      : "Start by detecting the host surface, then fetch the matching agent context.";

  const guidanceIds = listGuidance().map((item) => `- ${item.id} (${item.kind}): ${item.title}`).join("\n");

  return [
    "# ChatData Agent Context",
    "",
    surfaceLine,
    "",
    "Active buyer surfaces:",
    "- ChatData for Claude Code: personal/principal wedge using required plugin plus MCP.",
    "- ChatData for Codex via MCP: AI-native data catalog and workflow surface.",
    "- Slack is later-stage packaging only unless the user explicitly reactivates it.",
    "",
    "Thin operating rule:",
    "- Keep local setup and agent docs compact.",
    "- Fetch metric packets, answer paths, proof receipts, the reliability contract, CDO review rules, warehouse-query route, pilot security posture, or setup troubleshooting only when needed.",
    "- For KPI, traffic, funnel, revenue, retention, conversion, activation, usage, or other business-metric questions, use ChatData MCP before direct source tools; then write back proof if the answer is reusable.",
    "",
    "Setup:",
    `- ${setupLine}`,
    "- This tool returns context only. It does not write arbitrary workspace files.",
    "",
    "Security language:",
    "- Say scoped, reviewed, metadata-only, or approved where accurate.",
    "- Do not claim sandboxing. The MCP server stores config and approved metadata locally; host agents and shell commands run with permissions the user grants.",
    "",
    "Available guidance ids:",
    guidanceIds
  ].join("\n");
}

export function artifactTypeFromPath(path: string): TrustReceiptSummary["type"] | null {
  if (path.startsWith("metrics/")) return "metric";
  if (path.startsWith("answer-paths/")) return "answer_path";
  if (path.startsWith("proof/")) return "proof_receipt";
  if (path.startsWith("artifacts/") || path.startsWith("trusted-artifacts/")) return "trusted_artifact";

  return null;
}

export function extractTrustReceiptFields(input: {
  path: string;
  content: string;
  content_hash?: string | null;
}): TrustReceiptSummary {
  const type = artifactTypeFromPath(input.path) ?? "trusted_artifact";
  const contentHash = input.content_hash ?? hashContent(input.content);
  const title = sanitizeField(extractTitle(input.content));
  const source = firstNonEmpty(
    extractLabeledField(input.content, ["source", "sources"]),
    extractSection(input.content, ["source", "sources", "source references"])
  );
  const freshness = firstNonEmpty(
    extractLabeledField(input.content, ["freshness", "freshness policy"]),
    extractSection(input.content, ["freshness"])
  );
  const validation = firstNonEmpty(
    extractLabeledField(input.content, ["validation", "validation status"]),
    extractSection(input.content, ["validation", "evidence checked"])
  );
  const caveats = firstNonEmpty(
    extractLabeledField(input.content, ["caveats", "limits"]),
    extractSection(input.content, ["caveats", "known caveats", "limits"])
  );
  const currentFrame = firstNonEmpty(
    extractLabeledField(input.content, ["current_frame", "current frame", "decision", "frame decision"]),
    extractSection(input.content, ["current frame", "decision", "frame decision"])
  );
  const disconfirmingEvidence = firstNonEmpty(
    extractLabeledField(input.content, ["disconfirming_evidence", "disconfirming evidence"]),
    extractSection(input.content, ["disconfirming evidence", "what would change this"])
  );
  const actionImplications = firstNonEmpty(
    extractLabeledField(input.content, ["action_implications", "action implications", "next action"]),
    extractSection(input.content, ["action implications", "next action"])
  );
  const uncertainty = firstNonEmpty(
    extractLabeledField(input.content, ["uncertainty", "uncertainty_policy", "uncertainty policy"]),
    extractSection(input.content, ["uncertainty", "uncertainty policy"])
  );
  const sources = extractSourceReferences(input.content, source);
  const anchors = extractAnchors(input.content);

  return {
    path: input.path,
    type,
    title,
    content_hash: contentHash,
    metadata_only: true,
    raw_rows_included: false,
    source_references: sources,
    trust_fields: {
      review_state: sanitizeField(extractLabeledField(input.content, ["review_state", "review state"])),
      owner: sanitizeField(extractLabeledField(input.content, ["owner"])),
      metric_id: sanitizeField(extractLabeledField(input.content, ["metric_id", "metric"])),
      answer_state: sanitizeField(extractLabeledField(input.content, ["answer_state", "answer state"])),
      source: sanitizeField(source),
      freshness: sanitizeField(freshness),
      validation: sanitizeField(validation),
      caveats: sanitizeField(caveats),
      current_frame: sanitizeField(currentFrame),
      anchors,
      disconfirming_evidence: sanitizeField(disconfirmingEvidence),
      action_implications: sanitizeField(actionImplications),
      uncertainty: sanitizeField(uncertainty)
    },
    evidence_checklist: {
      source_reference: sources.length > 0,
      freshness: Boolean(sanitizeField(freshness)),
      validation: Boolean(sanitizeField(validation)),
      caveats: Boolean(sanitizeField(caveats)),
      frame_or_decision: Boolean(sanitizeField(currentFrame)),
      disconfirming_evidence: Boolean(sanitizeField(disconfirmingEvidence)),
      action_implications: Boolean(sanitizeField(actionImplications))
    }
  };
}

function toListItem(record: GuidanceRecord): GuidanceListItem {
  return {
    id: record.id,
    kind: record.kind,
    title: record.title,
    description: record.description,
    version: record.version,
    recommended_when: record.recommended_when,
    content_hash: hashContent(record.markdown)
  };
}

function hashContent(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m) ?? markdown.match(/^title\s*[:=]\s*(.+)$/im);
  return match?.[1]?.trim() ?? null;
}

function extractLabeledField(markdown: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&").replace(/_/g, "[_ ]");
    const regex = new RegExp(`^\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*[:=-]\\s*(.+)$`, "im");
    const match = markdown.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function extractSection(markdown: string, headings: string[]): string | null {
  const headingSet = new Set(headings.map((heading) => normalizeHeading(heading)));
  const lines = markdown.split(/\r?\n/);
  const collected: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      const normalized = normalizeHeading(headingMatch[1]);
      if (collecting) {
        break;
      }

      collecting = headingSet.has(normalized);
      continue;
    }

    if (collecting) {
      collected.push(line);
    }
  }

  return collected.length > 0 ? collected.join("\n").trim() : null;
}

function normalizeHeading(value: string): string {
  return value.toLowerCase().replace(/[`*_:#-]/g, "").replace(/\s+/g, " ").trim();
}

function extractSourceReferences(markdown: string, source: string | null): string[] {
  const references = new Set<string>();

  if (source) {
    references.add(source);
  }

  for (const match of markdown.matchAll(/\[([^\]]{1,120})\]\(([^)\s]{1,240})\)/g)) {
    references.add(`${match[1]} (${match[2]})`);
  }

  const sotLabels = [
    "raw_sql_sot",
    "verified_dashboard_sot",
    "verified_report_sot",
    "sql_or_retrieval_path"
  ];

  for (const value of sotLabels.map((label) => extractLabeledField(markdown, [label]))) {
    if (value) {
      references.add(value);
    }
  }

  return [...references].map((value) => sanitizeField(value)).filter((value): value is string => Boolean(value)).slice(0, 8);
}

function extractAnchors(markdown: string): string[] {
  const labeled = extractLabeledField(markdown, ["anchors"]);
  const section = extractSection(markdown, ["anchors"]);
  const raw = labeled ?? section;

  if (!raw) {
    return [];
  }

  return raw
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .map((line) => sanitizeField(line))
    .filter((line): line is string => Boolean(line))
    .slice(0, 8);
}

function firstNonEmpty(...values: Array<string | null>): string | null {
  return values.find((value) => Boolean(value?.trim())) ?? null;
}

function sanitizeField(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const withoutCode = value.replace(/```[\s\S]*?```/g, "[code omitted]");
  if (containsRowLevelContent(withoutCode)) {
    return "[omitted: row-level content]";
  }

  const compact = withoutCode
    .replace(/\s+/g, " ")
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|AKIA[0-9A-Z]{16})\b/g, "[secret redacted]")
    .replace(/\b(?:postgres|mysql|mongodb|redis|redshift):\/\/[^:\s]+:[^@\s]+@/gi, "[connection string redacted]")
    .replace(/\b(?:api[_-]?key|token|secret|password|credential|passwd|pwd)\s*[:=]\s*\S{8,}/gi, "[credential redacted]")
    .trim();

  if (!compact) {
    return null;
  }

  return compact.slice(0, 700);
}

function containsRowLevelContent(value: string): boolean {
  const normalized = value.replace(/\r\n/g, "\n");

  if (/"?row_data_included"?\s*[:=]\s*true/i.test(normalized)) {
    return true;
  }

  if (/\[(\s*\{[^}]+\}\s*,?\s*){5,}\]/.test(normalized)) {
    return true;
  }

  let csvRunLength = 0;
  for (const line of normalized.split("\n")) {
    const trimmed = line.trim();
    const looksLikeCsvRow = trimmed.length > 0 &&
      !trimmed.startsWith("|") &&
      trimmed.split(",").filter((part) => part.trim().length > 0).length >= 3;

    csvRunLength = looksLikeCsvRow ? csvRunLength + 1 : 0;
    if (csvRunLength >= 5) {
      return true;
    }
  }

  return false;
}
