import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pluginRoot = join(scriptDir, "..");
const scriptPath = join(scriptDir, "chatdata-session-hook.js");
const hooksConfig = JSON.parse(readFileSync(join(pluginRoot, "hooks", "hooks.json"), "utf8"));

function runHook(payload) {
  const result = spawnSync(process.execPath, [scriptPath], {
    input: JSON.stringify(payload),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function parseHookOutput(stdout) {
  assert.notEqual(stdout, "");
  return JSON.parse(stdout);
}

{
  const output = parseHookOutput(runHook({
    hook_event_name: "UserPromptSubmit",
    prompt: "Pull latest ChatEB1 visits trailing 7d from PostHog."
  }));

  assert.equal(output.hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.match(output.systemMessage, /business metric request/i);
  assert.match(output.systemMessage, /ChatData before direct source tools/i);
  assert.match(output.systemMessage, /chatdata_prepare_metric_answer/i);
  assert.match(output.systemMessage, /submit reviewed outcome feedback/i);
}

{
  const output = parseHookOutput(runHook({
    hook_event_name: "PostToolUse",
    tool_name: "chatdata_prepare_metric_answer"
  }));

  assert.equal(output.hookSpecificOutput.hookEventName, "PostToolUse");
  assert.match(output.systemMessage, /ChatData context was just read/i);
}

{
  const output = runHook({
    hook_event_name: "UserPromptSubmit",
    prompt: "Do a raw source check only, skip ChatData, and show the PostHog payload."
  });

  assert.equal(output, "");
}

{
  const output = parseHookOutput(runHook({
    hook_event_name: "PostToolUse",
    tool_name: "mcp__posthog__query",
    tool_input: {
      query: "trailing 7 day visits and sessions"
    },
    result: {
      rows: [{ date: "2026-06-25", visits: 42 }]
    }
  }));

  assert.equal(output.hookSpecificOutput.hookEventName, "PostToolUse");
  assert.match(output.systemMessage, /source-read tool/i);
  assert.match(output.systemMessage, /write it back through ChatData MCP/i);
}

{
  const output = parseHookOutput(runHook({
    hook_event_name: "PostToolUse",
    tool_name: "chatdata_pull_context"
  }));

  assert.equal(output.hookSpecificOutput.hookEventName, "PostToolUse");
  assert.match(output.systemMessage, /ChatData context was just read/i);
}

{
  const tempRoot = mkdtempSync(join(tmpdir(), "chatdata plugin root "));
  try {
    mkdirSync(join(tempRoot, "scripts"));
    cpSync(scriptPath, join(tempRoot, "scripts", "chatdata-session-hook.js"), { recursive: true });
    const configuredCommand = hooksConfig.hooks.SessionStart[0].hooks[0].command;
    const result = spawnSync(configuredCommand, {
      shell: true,
      input: JSON.stringify({
        hook_event_name: "SessionStart",
        source: "startup"
      }),
      encoding: "utf8",
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: tempRoot
      }
    });

    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(configuredCommand, /\$PLUGIN_ROOT/);
    assert.match(configuredCommand, /"\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/chatdata-session-hook\.js"/);
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}
