#!/usr/bin/env node

async function readStdin() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

function hookEventName(payload) {
  return String(payload.hook_event_name ?? payload.hookEventName ?? payload.event_name ?? payload.eventName ?? "");
}

function toolName(payload) {
  return String(
    payload.tool_name ??
    payload.toolName ??
    payload.tool?.name ??
    payload.tool_input?.name ??
    payload.toolUse?.name ??
    ""
  );
}

function textFromUnknown(value) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(textFromUnknown).join(" ");
  if (typeof value === "object") {
    return Object.values(value).map(textFromUnknown).join(" ");
  }
  return String(value);
}

function userPromptText(payload) {
  return textFromUnknown(
    payload.prompt ??
    payload.user_prompt ??
    payload.userPrompt ??
    payload.message ??
    payload.messages ??
    payload.transcript ??
    payload.input ??
    ""
  );
}

function toolPayloadText(payload) {
  return [
    toolName(payload),
    textFromUnknown(payload.tool_input ?? payload.toolInput ?? payload.input ?? ""),
    textFromUnknown(payload.tool_response ?? payload.toolResponse ?? payload.response ?? payload.result ?? "")
  ].join(" ");
}

function isMetricRelated(text) {
  return /\b(metric|kpi|dashboard|report|visits?|visitors?|sessions?|pageviews?|traffic|conversion|funnel|retention|activation|usage|revenue|arr|mrr|pipeline|churn|signup|checkout|purchase|orders?|customers?|cohort|trailing|last\s+\d+\s*(d|day|days|w|week|weeks)|week[-\s]?over[-\s]?week|month[-\s]?over[-\s]?month)\b/i.test(text);
}

function explicitlyRawSource(text) {
  return /\b(raw source check|raw source only|skip chatdata|do not use chatdata|don't use chatdata|without chatdata|bypass chatdata)\b/i.test(text);
}

function isLikelySourceRead(text) {
  return /(posthog|warehouse|snowflake|bigquery|redshift|databricks|looker|tableau|metabase|dbt|sql|query|spreadsheet|sheets?|csv|parquet|events?|pageviews?)/i.test(text);
}

function emitAdditionalContext(eventName, message) {
  process.stdout.write(JSON.stringify({
    systemMessage: message,
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext: message
    }
  }) + "\n");
}

const sessionStartContext = [
  "ChatData MCP is read-write, not a read-only connector.",
  "For ChatData work, first run chatdata_doctor, then chatdata_pull_context.",
  "For metric, KPI, traffic, revenue, funnel, retention, conversion, activation, usage, dashboard, or SQL questions, use ChatData MCP before direct source tools unless the user explicitly asks for a raw source check.",
  "If only five ChatData tools are visible, restart or reconnect Claude Code because the session is using a stale MCP tool cache.",
  "When the session creates reusable metric logic, proof, caveats, routes, or corrections, write it back with chatdata_record_session_context or the smallest write tool, then run chatdata_run_context_steward and chatdata_list_review_queue.",
  "Pending context is review work; do not call it trusted until approved."
].join(" ");

const postContextReadReminder = [
  "ChatData context was just read.",
  "If the answer creates reusable knowledge, call chatdata_record_session_context, chatdata_create_proof_receipt, chatdata_save_answer_path, chatdata_create_metric_card, or chatdata_propose_patch.",
  "After any write, run chatdata_run_context_steward and chatdata_list_review_queue."
].join(" ");

const metricPromptReminder = [
  "This looks like a business metric request.",
  "Route through ChatData before direct source tools: run chatdata_doctor if needed, run chatdata_pull_context, then search/read the relevant metric packet, source note, answer path, proof receipt, caveat, or guidance.",
  "Only query PostHog, warehouse, BI, spreadsheet, or file tools after the ChatData context pass unless the user explicitly asked for a raw source check.",
  "If approved context is missing or ambiguous, choose clarification_needed or needs_analyst_review instead of silently inventing a definition.",
  "If the answer is reusable, write back proof with chatdata_record_session_context, chatdata_create_proof_receipt, chatdata_save_answer_path, or chatdata_create_metric_card."
].join(" ");

const postSourceReadReminder = [
  "A likely source-read tool just ran during a metric-style workflow.",
  "Before calling the result trusted or reusable, confirm ChatData context was used for the metric definition and source route.",
  "If this source read created a reusable answer, caveat, validation result, or route, write it back through ChatData MCP and then run steward/review checks."
].join(" ");

try {
  const raw = await readStdin();
  const payload = raw.trim() ? JSON.parse(raw) : {};
  const eventName = hookEventName(payload);

  if (eventName === "SessionStart") {
    emitAdditionalContext("SessionStart", sessionStartContext);
    process.exit(0);
  }

  if (eventName === "UserPromptSubmit") {
    const promptText = userPromptText(payload);
    if (isMetricRelated(promptText) && !explicitlyRawSource(promptText)) {
      emitAdditionalContext("UserPromptSubmit", metricPromptReminder);
    }
    process.exit(0);
  }

  if (eventName === "PostToolUse") {
    const usedTool = toolName(payload);
    if (/chatdata_(pull_context|search_context|read_context_file)$/.test(usedTool)) {
      emitAdditionalContext("PostToolUse", postContextReadReminder);
      process.exit(0);
    }

    const sourceText = toolPayloadText(payload);
    if (!/chatdata_/i.test(usedTool) && isLikelySourceRead(sourceText) && isMetricRelated(sourceText) && !explicitlyRawSource(sourceText)) {
      emitAdditionalContext("PostToolUse", postSourceReadReminder);
    }
  }
} catch (error) {
  process.stderr.write(`ChatData session hook skipped: ${error instanceof Error ? error.message : String(error)}\n`);
}
