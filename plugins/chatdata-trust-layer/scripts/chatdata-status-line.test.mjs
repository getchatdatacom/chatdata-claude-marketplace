import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(scriptDir, "chatdata-status-line.js");

function runStatusLine({ cwd, home, env = {} }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd,
      env: {
        ...process.env,
        HOME: home,
        NO_COLOR: "1",
        CHATDATA_STATUSLINE_COLOR: "false",
        ...env
      }
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) => {
      resolve({ status, stdout, stderr });
    });
  });
}

function withDoctorServer(doctorPayload, callback) {
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      assert.equal(request.method, "POST");
      const payload = JSON.parse(body || "{}");
      assert.equal(payload.method, "tools/call");
      assert.equal(payload.params?.name, "chatdata_doctor");
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        jsonrpc: "2.0",
        id: payload.id,
        result: {
          content: [{ type: "text", text: JSON.stringify(doctorPayload) }]
        }
      }));
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", async () => {
      const address = server.address();
      try {
        const result = await callback(`http://127.0.0.1:${address.port}/api/mcp`);
        server.close(() => resolve(result));
      } catch (error) {
        server.close(() => reject(error));
      }
    });
  });
}

{
  const tempRoot = mkdtempSync(join(tmpdir(), "chatdata-status-state-only-"));
  const home = join(tempRoot, "home");
  const project = join(tempRoot, "project");
  const homeChatdata = join(home, ".chatdata");
  try {
    mkdirSync(homeChatdata, { recursive: true });
    mkdirSync(project, { recursive: true });
    writeFileSync(join(homeChatdata, "status-line-state.json"), JSON.stringify({
      checked_at: new Date().toISOString(),
      ok: true,
      domain: "example.com",
      mcp_checked: true,
      read_only: false,
      required_write_tools_present: true,
      roi: {
        estimate: {
          loops_avoided: 0,
          hours_saved: 0,
          cost_avoided_usd: 0
        },
        observed: {
          active_members: 1,
          metric_cards: 2,
          proof_receipts: 1
        }
      }
    }));

    const result = await runStatusLine({
      cwd: project,
      home,
      env: { CHATDATA_STATUSLINE_DISABLE_LIVE: "1" }
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /mcp:write-ready/);
    assert.match(result.stdout, /metrics:2/);
    assert.match(result.stdout, /proof:1/);
    assert.doesNotMatch(result.stdout, /mcp:missing/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

await withDoctorServer({
  ok: true,
  domain: "api-key-only.com",
  read_only: false,
  required_write_tools_present: true,
  approved_context_files: 3,
  roi: {
    estimate: {
      loops_avoided: 2,
      hours_saved: 1.5,
      cost_avoided_usd: 300
    },
    observed: {
      active_members: 2,
      metric_cards: 4,
      proof_receipts: 2
    }
  }
}, async (mcpUrl) => {
  const tempRoot = mkdtempSync(join(tmpdir(), "chatdata-status-mcp-only-"));
  const home = join(tempRoot, "home");
  const project = join(tempRoot, "project");
  const claudeDir = join(home, ".claude");
  try {
    mkdirSync(claudeDir, { recursive: true });
    mkdirSync(project, { recursive: true });
    writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({
      mcpServers: {
        chatdata: {
          type: "http",
          url: mcpUrl,
          headers: {
            Authorization: "Bearer cdk_test"
          }
        }
      }
    }));

    const result = await runStatusLine({
      cwd: project,
      home,
      env: { CHATDATA_STATUSLINE_TIMEOUT_MS: "1000" }
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CHATDATA blocked 2 AI analytics slop loops/);
    assert.match(result.stdout, /workspace saved:1\.5h/);
    assert.match(result.stdout, /users:2/);
    assert.match(result.stdout, /mcp:write-ready/);
    assert.match(result.stdout, /trust:4 metrics/);
    assert.match(result.stdout, /context:3/);
    assert.doesNotMatch(result.stdout, /mcp:missing/);

    const state = JSON.parse(readFileSync(join(home, ".chatdata", "status-line-state.json"), "utf8"));
    assert.equal(state.domain, "api-key-only.com");
    assert.equal(state.mcp_checked, true);
    assert.equal(state.required_write_tools_present, true);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
