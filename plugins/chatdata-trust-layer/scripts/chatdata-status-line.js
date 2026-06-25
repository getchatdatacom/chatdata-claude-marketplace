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

function freshStatusLineState(home, domain) {
  const state = readJson(path.join(home, "status-line-state.json"), {});
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

  const maxAgeMs = Number(process.env.CHATDATA_STATUSLINE_MAX_AGE_MS || 6 * 60 * 60 * 1000);
  if (Date.now() - checkedAt > maxAgeMs) {
    return { ...state, stale: true };
  }

  return state;
}

function mcpStatusLabel(home, domain) {
  if (!domain) {
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
  if (state.read_only === false && state.required_write_tools_present === true) {
    return "mcp:write-ready";
  }
  if (state.read_only === true || state.required_write_tools_present === false) {
    return "mcp:read-only";
  }

  return "mcp:checked";
}

function mcpContextInfo(home) {
  const config = readJson(path.join(home, "config.json"), {});
  const domain = config && config.domain ? String(config.domain) : "";
  if (!domain) {
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

  const contextDir = path.join(home, "context", domainCacheSegment(domain));
  const manifest = readJson(path.join(contextDir, "manifest.json"), {});
  const cachedCount = Number(manifest.cached_count || 0);
  return {
    configured: true,
    domain,
    contextDir,
    manifest,
    cachedCount: Number.isFinite(cachedCount) ? cachedCount : 0,
    metricCount: countManifestFiles(manifest, "metrics/"),
    proofCount: countManifestFiles(manifest, "proof/"),
    statusLabel: mcpStatusLabel(home, domain),
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

function main() {
  const home = path.join(os.homedir(), ".chatdata");
  const projectState = walkUpForProjectState(process.cwd());
  const license = readJson(path.join(home, "license.json"), {});
  const mcpContext = mcpContextInfo(home);
  const companyRepo = readJson(path.join(projectState, "company-repo.json"), {});
  const onboarding = readJson(path.join(projectState, "onboarding.json"), {});
  const repoPath = companyRepo && companyRepo.path ? String(companyRepo.path) : "";
  const proofPath = repoPath
    ? path.join(repoPath, "proof", "impact-log.jsonl")
    : path.join(projectState, "impact-log.jsonl");
  const impact = proofImpact(readJsonl(proofPath));
  const contextState = mcpContext.configured
    ? mcpContext.statusLabel
    : repoPath
      ? "repo:on"
      : "mcp:missing";
  const syncState = mcpContext.configured
    ? mcpContext.cachedCount > 0
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
  const metricTotal = Math.max(mcpContext.metricCount, metricCount(repoPath, projectState));
  const proofTotal = Math.max(mcpContext.proofCount, countLines(proofPath));

  if (impact.loops > 0) {
    const valueLabel = `${formatUsd(impact.value)}${impact.valueIsEstimated ? " est" : ""}`;
    console.log(
      `${color("CHATDATA", "1;32")} blocked ${color(String(impact.loops), "1;36")} AI analytics slop loops` +
        ` | saved:${color(formatHours(impact.minutes), "1;36")}` +
        ` | cost avoided:${color(valueLabel, "1;32")}` +
        ` | trust:${metricTotal} metric${metricTotal === 1 ? "" : "s"}` +
        ` | ${syncState} | trial:${daysRemaining(license)}`,
    );
    return;
  }

  console.log(
    `${color("CHATDATA", "1;32")} stops AI analytics slop` +
      ` | ${contextState} | ${syncState} | metrics:${metricTotal}` +
      ` | proof:${proofTotal} | ${onboardingState} | trial:${daysRemaining(license)}`,
  );
}

main();
