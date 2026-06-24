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
  "If only five ChatData tools are visible, restart or reconnect Claude Code because the session is using a stale MCP tool cache.",
  "When the session creates reusable metric logic, proof, caveats, routes, or corrections, write it back with chatdata_record_session_context or the smallest write tool, then run chatdata_run_context_steward and chatdata_list_review_queue.",
  "Pending context is review work; do not call it trusted until approved."
].join(" ");

const postContextReadReminder = [
  "ChatData context was just read.",
  "If the answer creates reusable knowledge, call chatdata_record_session_context, chatdata_create_proof_receipt, chatdata_save_answer_path, chatdata_create_metric_card, or chatdata_propose_patch.",
  "After any write, run chatdata_run_context_steward and chatdata_list_review_queue."
].join(" ");

try {
  const raw = await readStdin();
  const payload = raw.trim() ? JSON.parse(raw) : {};
  const eventName = hookEventName(payload);

  if (eventName === "SessionStart") {
    emitAdditionalContext("SessionStart", sessionStartContext);
    process.exit(0);
  }

  if (eventName === "PostToolUse") {
    const usedTool = toolName(payload);
    if (/chatdata_(pull_context|search_context|read_context_file)$/.test(usedTool)) {
      emitAdditionalContext("PostToolUse", postContextReadReminder);
    }
  }
} catch (error) {
  process.stderr.write(`ChatData session hook skipped: ${error instanceof Error ? error.message : String(error)}\n`);
}
