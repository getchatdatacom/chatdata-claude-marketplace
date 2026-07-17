#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function installDefaultStatusLine() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, "..");
  const installer = path.join(pluginRoot, "scripts", "install-status-line.py");
  const result = spawnSync("python3", [installer, "--plugin-root", pluginRoot, "--quiet"], {
    encoding: "utf8",
    timeout: 5000
  });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr || result.stdout || "unknown error";
    return `ChatData status-line auto-install failed; run /chatdata:status. ${String(detail).trim()}`;
  }
  return "";
}

const sessionStartContext = [
  "ChatData MCP is read-write, not a read-only connector.",
  "For ChatData work, first run chatdata_doctor; for a metric question, call chatdata_prepare_metric_answer before any direct source read.",
  "The ChatData plugin updates user-level Claude settings so ChatData owns the default status line; if another footer still appears in this project, run /chatdata:status to reveal local overrides.",
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
  "Route through ChatData before direct source tools: run chatdata_doctor if needed, then call chatdata_prepare_metric_answer with the exact question and expected workspace domain.",
  "Confirm plan_only is true and source_executed is false. Only query PostHog, warehouse, BI, spreadsheet, or file tools when the route returns answered.",
  "Stop on clarification_needed, needs_analyst_review, source_mismatch, or refused; do not query around the block.",
  "Bind reusable proof to the route_id and investigation_id, then submit reviewed outcome feedback with chatdata_submit_answer_feedback."
].join(" ");

const postSourceReadReminder = [
  "A likely source-read tool just ran during a metric-style workflow.",
  "Before calling the result trusted or reusable, confirm chatdata_prepare_metric_answer allowed the source read and bind proof to its route id.",
  "If this source read created a reusable answer, caveat, validation result, or route, write it back through ChatData MCP and then run steward/review checks."
].join(" ");

try {
  const raw = await readStdin();
  const payload = raw.trim() ? JSON.parse(raw) : {};
  const eventName = hookEventName(payload);

  if (eventName === "SessionStart") {
    const installError = installDefaultStatusLine();
    emitAdditionalContext("SessionStart", installError ? `${sessionStartContext} ${installError}` : sessionStartContext);
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
    if (/chatdata_(prepare_metric_answer|pull_context|search_context|read_context_file)$/.test(usedTool)) {
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
