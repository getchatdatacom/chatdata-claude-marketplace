#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function countLines(filePath) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim()).length;
  } catch {
    return 0;
  }
}

function readJsonl(filePath) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function formatHours(minutes) {
  const hours = minutes / 60;
  if (hours < 1) {
    return `${Math.round(minutes)}m`;
  }
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

function formatUsd(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  }
  return `$${Math.round(value)}`;
}

function proofImpact(entries) {
  const minutes = entries.reduce((sum, entry) => sum + Number(entry.estimated_time_saved_minutes || 0), 0);
  const recordedValue = entries.reduce((sum, entry) => sum + Number(entry.estimated_value_usd || 0), 0);
  const analystHourlyRate = Number(process.env.CHATDATA_STATUSLINE_HOURLY_RATE || 120);
  const value = recordedValue > 0 ? recordedValue : (minutes / 60) * analystHourlyRate;
  return {
    loops: entries.length,
    minutes,
    value,
    valueIsEstimated: recordedValue <= 0 && minutes > 0,
  };
}

function roiImpactFromState(state) {
  if (!state || typeof state !== "object" || state.stale) {
    return null;
  }

  const workspaceStatus = state.workspace_status && typeof state.workspace_status === "object"
    ? state.workspace_status
    : {};
  const roi = state.roi && typeof state.roi === "object"
    ? state.roi
    : workspaceStatus.roi && typeof workspaceStatus.roi === "object"
      ? workspaceStatus.roi
      : null;
  if (!roi) {
    return null;
  }

  const estimate = roi.estimate && typeof roi.estimate === "object" ? roi.estimate : {};
  const observed = roi.observed && typeof roi.observed === "object" ? roi.observed : {};
  const loops = Number(estimate.loops_avoided ?? 0);
  const hours = Number(estimate.hours_saved ?? 0);
  const value = Number(estimate.cost_avoided_usd ?? 0);
  if (!Number.isFinite(loops)) {
    return null;
  }

  const members = Number(observed.active_members || 0);
  return {
    loops: Math.max(0, loops),
    minutes: Number.isFinite(hours) ? Math.max(0, hours) * 60 : 0,
    value: Number.isFinite(value) ? Math.max(0, value) : 0,
    valueIsEstimated: true,
    scope: "workspace",
    members: Number.isFinite(members) && members > 0 ? members : 0,
  };
}

function domainCacheSegment(domain) {
  return String(domain || "")
    .split(".")[0]
    .replace(/[^a-z0-9_-]/gi, "-")
    .toLowerCase();
}

function countManifestFiles(manifest, prefix) {
  const files = manifest && Array.isArray(manifest.files) ? manifest.files : [];
  return files.filter((file) => file && typeof file.path === "string" && file.path.startsWith(prefix)).length;
}

function statusLineStatePath(home) {
  return path.join(home, "status-line-state.json");
}

function parseStatusLineState(home, domain) {
  const state = readJson(statusLineStatePath(home), {});
  if (!state || typeof state !== "object") {
    return null;
  }
  if (domain && state.domain && String(state.domain) !== String(domain)) {
    return null;
  }

  const checkedAt = Date.parse(String(state.checked_at || ""));
  if (!Number.isFinite(checkedAt)) {
    return null;
  }

  return { state, checkedAt };
}

function freshStatusLineState(home, domain) {
  const parsed = parseStatusLineState(home, domain);
  if (!parsed) return null;

  const maxAgeMs = Number(process.env.CHATDATA_STATUSLINE_MAX_AGE_MS || 6 * 60 * 60 * 1000);
  if (Date.now() - parsed.checkedAt > maxAgeMs) {
    return { ...parsed.state, stale: true };
  }

  return parsed.state;
}

function shouldRefreshStatusLineState(home, domain) {
  if (process.env.CHATDATA_STATUSLINE_DISABLE_LIVE === "1") {
    return false;
  }

  const parsed = parseStatusLineState(home, domain);
  if (!parsed) return true;

  const refreshMs = Number(process.env.CHATDATA_STATUSLINE_REFRESH_MS || 30 * 1000);
  return Date.now() - parsed.checkedAt > refreshMs;
}

function apiUrl(config, pathSuffix) {
  const configured = String(config.hub_url || "https://getchatdata.com/api").replace(/\/+$/, "");
  const base = configured.endsWith("/api") ? configured : `${configured}/api`;
  return `${base}${pathSuffix}`;
}

async function fetchJson(url, headers, timeoutMs) {
  if (typeof fetch !== "function" || typeof AbortController !== "function") {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, status: response.status };
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function headerValue(headers, key) {
  if (!headers || typeof headers !== "object") return "";
  const found = Object.entries(headers).find(([name]) => name.toLowerCase() === key.toLowerCase());
  return found && typeof found[1] === "string" ? found[1] : "";
}

function findChatDataMcpConfig() {
  const candidates = [
    path.join(os.homedir(), ".claude.json"),
    path.join(os.homedir(), ".claude", "settings.json"),
    path.join(os.homedir(), ".claude", "settings.local.json")
  ];

  for (const candidate of candidates) {
    const settings = readJson(candidate, {});
    const servers = settings && typeof settings === "object" ? settings.mcpServers : null;
    if (!servers || typeof servers !== "object") continue;

    for (const [name, server] of Object.entries(servers)) {
      if (!server || typeof server !== "object") continue;
      const serverUrl = typeof server.url === "string" ? server.url : "";
      if (name !== "chatdata" && !serverUrl.includes("getchatdata.com/api/mcp")) continue;

      const authorization = headerValue(server.headers, "Authorization");
      if (authorization) {
        return { url: serverUrl || "https://getchatdata.com/api/mcp", authorization };
      }
    }
  }

  return null;
}

async function callMcpTool(mcpConfig, name, timeoutMs) {
  if (!mcpConfig || typeof fetch !== "function" || typeof AbortController !== "function") {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(mcpConfig.url, {
      method: "POST",
      headers: {
        Authorization: mcpConfig.authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-ChatData-MCP-Client": "claude-status-line"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `status-line-${Date.now()}`,
        method: "tools/call",
        params: {
          name,
          arguments: {}
        }
      }),
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, status: response.status };
    const payload = await response.json();
    const text = payload && payload.result && Array.isArray(payload.result.content)
      ? payload.result.content[0] && payload.result.content[0].text
      : "";
    return text ? JSON.parse(text) : payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshStatusLineState(home, config, previousState, mcpConfig) {
  const timeoutMs = Number(process.env.CHATDATA_STATUSLINE_TIMEOUT_MS || 1500);
  const hasPortalConfig = Boolean(config && config.token && config.domain);
  const headers = hasPortalConfig
    ? {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
        "X-ChatData-MCP-Client": "claude-status-line"
      }
    : null;
  const [workspaceStatus, onboarding, doctor] = await Promise.all([
    hasPortalConfig ? fetchJson(apiUrl(config, "/workspace/status"), headers, timeoutMs) : null,
    hasPortalConfig ? fetchJson(apiUrl(config, "/workspace/onboarding"), headers, timeoutMs) : null,
    callMcpTool(mcpConfig, "chatdata_doctor", timeoutMs)
  ]);

  const doctorChecked = Boolean(doctor && typeof doctor.ok === "boolean");
  const doctorDomain = doctor && doctor.domain ? String(doctor.domain) : "";
  const workspaceDomain = workspaceStatus && typeof workspaceStatus === "object"
    ? String(workspaceStatus.domain || config.domain || "")
    : "";
  const doctorMatchesWorkspace = doctorChecked && (
    doctor.ok === false ||
    !doctorDomain ||
    !workspaceDomain ||
    doctorDomain === workspaceDomain
  );
  if ((!workspaceStatus || workspaceStatus.ok === false) && !doctorChecked) {
    return previousState;
  }

  const statusSource = workspaceStatus && workspaceStatus.ok !== false
    ? workspaceStatus
    : doctorChecked
      ? {
          ok: doctor.ok,
          domain: doctorDomain || (config && config.domain) || (previousState && previousState.domain) || "",
          approved_context_files: doctor.approved_context_files,
          roi: doctor.roi || null
        }
      : null;

  const state = {
    checked_at: new Date().toISOString(),
    ok: doctorMatchesWorkspace ? doctor.ok : Boolean(statusSource && statusSource.ok),
    domain: String((statusSource && statusSource.domain) || (config && config.domain) || doctorDomain || ""),
    mcp_checked: doctorMatchesWorkspace,
    read_only: doctorMatchesWorkspace && Object.prototype.hasOwnProperty.call(doctor, "read_only")
      ? doctor.read_only
      : previousState && Object.prototype.hasOwnProperty.call(previousState, "read_only")
        ? previousState.read_only
        : null,
    required_write_tools_present: doctorMatchesWorkspace && Object.prototype.hasOwnProperty.call(doctor, "required_write_tools_present")
      ? doctor.required_write_tools_present
      : previousState && Object.prototype.hasOwnProperty.call(previousState, "required_write_tools_present")
        ? previousState.required_write_tools_present
        : null,
    roi: statusSource && statusSource.roi ? statusSource.roi : doctorMatchesWorkspace && doctor.roi ? doctor.roi : null,
    workspace_status: statusSource,
    onboarding: onboarding && onboarding.ok !== false ? onboarding : null
  };

  try {
    writeJson(statusLineStatePath(home), state);
  } catch {
    return state;
  }
  return state;
}

async function currentStatusLineState(home, domain, config, mcpConfig) {
  const previous = freshStatusLineState(home, domain);
  if (!shouldRefreshStatusLineState(home, domain)) {
    return previous;
  }

  return await refreshStatusLineState(home, config, previous, mcpConfig) || previous;
}

function mcpStatusLabel(home, domain, configured = Boolean(domain)) {
  if (!domain && !configured) {
    return "mcp:missing";
  }

  const state = freshStatusLineState(home, domain);
  if (!state) {
    return "mcp:unverified";
  }
  if (state.stale) {
    return "mcp:stale";
  }
  if (state.ok === false) {
    return "mcp:error";
  }
  if (state.mcp_checked === false || (state.read_only === null && state.required_write_tools_present === null)) {
    return "mcp:unverified";
  }
  if (state.read_only === false && state.required_write_tools_present === true) {
    return "mcp:write-ready";
  }
  if (state.read_only === true || state.required_write_tools_present === false) {
    return "mcp:read-only";
  }

  return "mcp:checked";
}

function mcpContextInfo(home, config, state, mcpConfig) {
  const domain = config && config.domain
    ? String(config.domain)
    : state && state.domain
      ? String(state.domain)
      : "";
  const configured = Boolean(domain || mcpConfig);
  if (!configured) {
    return {
      configured: false,
      domain: "",
      contextDir: "",
      manifest: {},
      cachedCount: 0,
      metricCount: 0,
      proofCount: 0,
    };
  }

  const contextDir = domain ? path.join(home, "context", domainCacheSegment(domain)) : "";
  const manifest = contextDir ? readJson(path.join(contextDir, "manifest.json"), {}) : {};
  const cachedCount = Number(manifest.cached_count || 0);
  return {
    configured: true,
    domain,
    contextDir,
    manifest,
    cachedCount: Number.isFinite(cachedCount) ? cachedCount : 0,
    metricCount: countManifestFiles(manifest, "metrics/"),
    proofCount: countManifestFiles(manifest, "proof/"),
    statusLabel: mcpStatusLabel(home, domain, configured),
  };
}

function walkUpForProjectState(startDir) {
  let current = path.resolve(startDir || process.cwd());
  while (true) {
    const candidate = path.join(current, ".chatdata");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const next = path.dirname(current);
    if (next === current) {
      return path.join(path.resolve(startDir || process.cwd()), ".chatdata");
    }
    current = next;
  }
}

function daysRemaining(license) {
  if (license && Number.isFinite(Number(license.trial_days_left))) {
    return `${Math.max(0, Math.ceil(Number(license.trial_days_left)))}d`;
  }

  const end = license && license.trial_ends_at;
  if (!end) {
    return "trial";
  }
  const diffMs = new Date(end).getTime() - Date.now();
  if (!Number.isFinite(diffMs)) {
    return "trial";
  }
  return `${Math.max(0, Math.ceil(diffMs / 86400000))}d`;
}

function metricCount(repoPath, projectStatePath) {
  const repoMetrics = repoPath ? path.join(repoPath, "metrics") : "";
  const localMetrics = path.join(projectStatePath, "metrics");
  const metricsDir = fs.existsSync(repoMetrics) ? repoMetrics : localMetrics;
  try {
    return fs.readdirSync(metricsDir).filter((name) => name.endsWith(".yaml")).length;
  } catch {
    return 0;
  }
}

function color(text, code) {
  if (process.env.NO_COLOR || process.env.CHATDATA_STATUSLINE_COLOR === "false") {
    return text;
  }
  return `\u001b[${code}m${text}\u001b[0m`;
}

function liveCountsFromState(state) {
  const onboarding = state && state.onboarding && typeof state.onboarding === "object" ? state.onboarding : {};
  const onboardingCounts = onboarding.counts && typeof onboarding.counts === "object" ? onboarding.counts : {};
  const workspaceStatus = state && state.workspace_status && typeof state.workspace_status === "object" ? state.workspace_status : {};
  const roi = state && state.roi && typeof state.roi === "object" ? state.roi : workspaceStatus.roi;
  const observed = roi && typeof roi === "object" && roi.observed && typeof roi.observed === "object" ? roi.observed : {};

  return {
    context: Number(onboardingCounts.approved_context_files ?? workspaceStatus.approved_context_files ?? 0),
    metrics: Number(onboardingCounts.approved_metrics ?? onboardingCounts.metrics ?? observed.metric_cards ?? 0),
    proof: Number(onboardingCounts.approved_proof_receipts ?? onboardingCounts.proof_receipts ?? observed.proof_receipts ?? 0)
  };
}

async function main() {
  const home = path.join(os.homedir(), ".chatdata");
  const projectState = walkUpForProjectState(process.cwd());
  const license = readJson(path.join(home, "license.json"), {});
  const config = readJson(path.join(home, "config.json"), {});
  const mcpConfig = findChatDataMcpConfig();
  const configuredDomain = config && config.domain ? String(config.domain) : "";
  const statusLineState = (configuredDomain || mcpConfig)
    ? await currentStatusLineState(home, configuredDomain, config, mcpConfig)
    : freshStatusLineState(home, "");
  const mcpContext = mcpContextInfo(home, config, statusLineState, mcpConfig);
  const companyRepo = readJson(path.join(projectState, "company-repo.json"), {});
  const onboarding = readJson(path.join(projectState, "onboarding.json"), {});
  const repoPath = companyRepo && companyRepo.path ? String(companyRepo.path) : "";
  const proofPath = repoPath
    ? path.join(repoPath, "proof", "impact-log.jsonl")
    : path.join(projectState, "impact-log.jsonl");
  const impact = roiImpactFromState(statusLineState) || (
    mcpContext.configured
      ? { loops: 0, minutes: 0, value: 0, valueIsEstimated: false }
      : proofImpact(readJsonl(proofPath))
  );
  const contextState = mcpContext.configured
    ? mcpStatusLabel(home, mcpContext.domain, true)
    : repoPath
      ? "repo:on"
      : "mcp:missing";
  const liveCounts = liveCountsFromState(statusLineState);
  const syncState = mcpContext.configured
    ? (Number.isFinite(liveCounts.context) && liveCounts.context > 0)
      ? `context:${liveCounts.context}`
      : mcpContext.cachedCount > 0
        ? `context:${mcpContext.cachedCount}`
        : "context:empty"
    : companyRepo && companyRepo.last_sync_status === "synced"
      ? "sync:on"
      : "sync:check";
  const onboardingState =
    mcpContext.configured
      ? "setup:mcp"
      :
    onboarding && onboarding.complete
      ? "onboarded"
      : onboarding && onboarding.total
        ? `setup:${onboarding.completed || 0}/${onboarding.total}`
        : "setup";
  const metricTotal = mcpContext.configured
    ? Number.isFinite(liveCounts.metrics) && liveCounts.metrics > 0
      ? liveCounts.metrics
      : mcpContext.metricCount
    : metricCount(repoPath, projectState);
  const proofTotal = mcpContext.configured
    ? Number.isFinite(liveCounts.proof) && liveCounts.proof > 0
      ? liveCounts.proof
      : mcpContext.proofCount
    : countLines(proofPath);
  const trialState = statusLineState && statusLineState.workspace_status
    ? statusLineState.workspace_status
    : license;

  if (impact.loops > 0) {
    const valueLabel = `${formatUsd(impact.value)}${impact.valueIsEstimated ? " est" : ""}`;
    const savedLabel = impact.scope === "workspace" ? "workspace saved" : "saved";
    const memberLabel = impact.scope === "workspace" && impact.members > 0 ? ` | users:${impact.members}` : "";
    console.log(
      `${color("CHATDATA", "1;32")} blocked ${color(String(impact.loops), "1;36")} AI analytics slop loops` +
        ` | ${savedLabel}:${color(formatHours(impact.minutes), "1;36")}` +
        ` | cost avoided:${color(valueLabel, "1;32")}` +
        memberLabel +
        ` | ${contextState}` +
        ` | trust:${metricTotal} metric${metricTotal === 1 ? "" : "s"}` +
        ` | ${syncState} | trial:${daysRemaining(trialState)}`,
    );
    return;
  }

  console.log(
    `${color("CHATDATA", "1;32")} stops AI analytics slop` +
      ` | ${contextState} | ${syncState} | metrics:${metricTotal}` +
      ` | proof:${proofTotal} | ${onboardingState} | trial:${daysRemaining(trialState)}`,
  );
}

main().catch(() => {
  console.log(`${color("CHATDATA", "1;32")} stops AI analytics slop | mcp:unverified | context:check | setup:mcp`);
});
