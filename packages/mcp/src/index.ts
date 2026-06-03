#!/usr/bin/env node
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

interface ChatDataConfig {
  token: string;
  workspace_id: string;
  domain: string;
  hub_url: string;
  consent?: {
    version: string;
    granted_at: string;
  };
  last_pull_revision?: string | null;
}

interface HubVerifyResponse {
  ok: boolean;
  token?: {
    sub: string;
    email: string;
    domain: string;
    workspace_id: string;
    is_owner: boolean;
    exp: number;
  };
  error?: string;
}

interface ContextFilePayload {
  path: string;
  type: string;
  version: number;
  content_hash: string;
  review_state: string;
  updated_at: string;
  revision: string;
  content: string;
}

interface ContextPullResponse {
  ok: boolean;
  revision: string;
  files: ContextFilePayload[];
  error?: string;
}

interface LocalContextFileSummary {
  path: string;
  local_path: string;
  version: number | null;
  content_hash: string | null;
}

interface ContextWriteResult {
  written: LocalContextFileSummary[];
  cached: LocalContextFileSummary[];
}

interface LocalQueueItem {
  tool: string;
  path: string;
  method: string;
  body?: unknown;
}

interface ConfigReadResult {
  config: ChatDataConfig | null;
  config_exists: boolean;
  config_readable: boolean;
  error_code?: string;
  error?: string;
}

class HubHttpError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const configPath = join(process.env.CHATDATA_CONFIG_DIR ?? join(homedir(), ".chatdata"), "config.json");
const cachePath = join(dirname(configPath), "context");
const defaultHubUrl = process.env.CHATDATA_HUB_URL ?? "https://getchatdata.com/api";

const server = new McpServer({
  name: "chatdata",
  version: "0.1.0"
});

server.tool("chatdata_status", "Read local ChatData MCP config and show workspace connection state.", {}, async () => {
  const configResult = await readConfigResult();
  const config = configResult.config;

  return text({
    ok: Boolean(config) && !configResult.error,
    configured: Boolean(config),
    config_exists: configResult.config_exists,
    config_readable: configResult.config_readable,
    config_path: configPath,
    cache_path: cachePath,
    workspace_id: config?.workspace_id ?? null,
    domain: config?.domain ?? null,
    hub_url: config?.hub_url ?? defaultHubUrl,
    consent: config?.consent ?? null,
    last_pull_revision: config?.last_pull_revision ?? null,
    error_code: configResult.error_code ?? null,
    error: configResult.error ?? null,
    next_action: configResult.error ? configRepairNextAction() : null
  });
});

server.tool(
  "chatdata_activate",
  "Store a ChatData hub token from the login page in ~/.chatdata/config.json.",
  {
    email: z.string().email(),
    token: z.string().min(20),
    hub_url: z.string().url().optional()
  },
  async ({ email, token, hub_url }) => {
    const hubUrl = normalizeHubUrl(hub_url ?? defaultHubUrl);
    const verified = await verifyHubToken(hubUrl, token);

    if (verified.token.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("Token email does not match the activation email.");
    }

    const config: ChatDataConfig = {
      token,
      workspace_id: verified.token.workspace_id,
      domain: verified.token.domain,
      hub_url: hubUrl,
      consent: {
        version: "metadata-sync-v1",
        granted_at: new Date().toISOString()
      },
      last_pull_revision: null
    };

    await writeConfig(config);

    return text({
      ok: true,
      config_path: configPath,
      workspace_id: config.workspace_id,
      domain: config.domain,
      hub_url: config.hub_url
    });
  }
);

server.tool(
  "chatdata_doctor",
  "Check ChatData MCP config, consent, and hub reachability.",
  {
    expected_domain: z.string().optional()
  },
  async ({ expected_domain }) => {
    const configResult = await readConfigResult();
    const config = configResult.config;

    if (configResult.error) {
      return text({
        ok: false,
        config_path: configPath,
        config_exists: configResult.config_exists,
        config_readable: configResult.config_readable,
        error_code: configResult.error_code,
        error: configResult.error,
        next_action: configRepairNextAction()
      });
    }

    if (!config) {
      return text({
        ok: false,
        config_path: configPath,
        next_action: "Open /activate, copy the token, then run chatdata_activate."
      });
    }

    const expectedDomain = normalizeExpectedDomain(expected_domain);

    if (expectedDomain && expectedDomain !== normalizeExpectedDomain(config.domain)) {
      return text({
        ok: false,
        domain_match: false,
        expected_domain: expectedDomain,
        domain: config.domain,
        workspace_id: config.workspace_id,
        hub_url: config.hub_url,
        config_path: configPath,
        next_action: "Open the expected workspace in ChatData Settings, copy the terminal setup command, run it, then rerun chatdata_doctor with expected_domain."
      });
    }

    const checks: Record<string, unknown> = {
      config_path: configPath,
      cache_path: cachePath,
      domain: config.domain,
      expected_domain: expectedDomain ?? null,
      domain_match: expectedDomain ? true : null,
      workspace_id: config.workspace_id,
      hub_url: config.hub_url,
      local_consent: config.consent ?? null
    };

    try {
      checks.workspace_status = await hubFetch(config, "/workspace/status");
      checks.consent_status = await hubFetch(config, "/workspace/consent");
      checks.ok = true;
    } catch (error) {
      checks.ok = false;
      checks.error = error instanceof Error ? error.message : String(error);
    }

    return text(checks);
  }
);

server.tool("chatdata_get_consent_status", "Read workspace consent state from the ChatData hub.", {}, async () => {
  const config = await requireConfig();
  return text(await hubFetch(config, "/workspace/consent"));
});

server.tool(
  "chatdata_grant_consent",
  "Grant metadata-sync-v1 consent for this workspace token.",
  {
    consent_version: z.string().default("metadata-sync-v1")
  },
  async ({ consent_version }) => {
    if (consent_version !== "metadata-sync-v1") {
      throw new Error("Only metadata-sync-v1 is supported.");
    }

    const config = await requireConfig();
    const response = await hubFetch(config, "/workspace/consent", { method: "POST" });
    config.consent = {
      version: consent_version,
      granted_at: new Date().toISOString()
    };
    await writeConfig(config);

    return text(response);
  }
);

server.tool("chatdata_revoke_consent", "Revoke hub consent and clear the local context cache.", {}, async () => {
  const config = await requireConfig();
  const response = await hubFetch(config, "/workspace/consent", { method: "DELETE" });
  delete config.consent;
  await writeConfig(config);
  await rm(cachePath, { force: true, recursive: true });

  return text({
    response,
    cache_cleared: cachePath
  });
});

server.tool(
  "chatdata_pull_context",
  "Pull approved ChatData context files from the hub and write them into the local ~/.chatdata cache.",
  {
    since_revision: z.string().optional()
  },
  async ({ since_revision }) => {
    const config = await requireConfig();
    const revision = since_revision ?? config.last_pull_revision ?? undefined;
    const query = revision ? `?since_revision=${encodeURIComponent(revision)}` : "";
    const response = (await hubFetch(config, `/context/pull${query}`)) as ContextPullResponse;
    const targetDir = domainCachePath(config.domain);
    const contextFiles = await writeContextFiles(targetDir, response.files ?? [], !revision);

    config.last_pull_revision = response.revision ?? config.last_pull_revision ?? null;
    await writeConfig(config);

    return text({
      ok: true,
      cache_path: targetDir,
      pull_mode: revision ? "incremental" : "full",
      since_revision: revision ?? null,
      revision: response.revision ?? null,
      pulled_count: contextFiles.written.length,
      pulled_files: contextFiles.written,
      file_count: contextFiles.cached.length,
      cached_count: contextFiles.cached.length,
      context_available: contextFiles.cached.length > 0,
      empty_workspace: contextFiles.cached.length === 0,
      interpretation: contextFiles.cached.length > 0
        ? "Approved context is available in the local cache. pulled_count is only the number of files changed in this incremental pull."
        : "No approved Markdown context files are currently cached for this workspace.",
      files: contextFiles.cached,
      last_pull_revision: config.last_pull_revision
    });
  }
);

server.tool(
  "chatdata_search_context",
  "Search approved context files in the ChatData hub.",
  {
    q: z.string().min(1),
    include_drafts: z.boolean().optional()
  },
  async ({ q, include_drafts }) => {
    const config = await requireConfig();
    const params = new URLSearchParams({ q });
    if (include_drafts) params.set("include_drafts", "true");

    return text(await hubFetch(config, `/context/search?${params.toString()}`));
  }
);

server.tool(
  "chatdata_read_context_file",
  "Read one context file from the local cache, falling back to the ChatData hub.",
  {
    path: z.string().min(1)
  },
  async ({ path }) => {
    if (!isSafeContextPath(path)) {
      return text(invalidContextPathResponse(path));
    }

    const config = await requireConfig();
    const localPath = join(domainCachePath(config.domain), path);

    try {
      const content = await readFile(localPath, "utf8");
      return text({ ok: true, source: "local_cache", path, local_path: localPath, content });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
        throw error;
      }
    }

    const response = await hubFetch(config, `/context/file/${encodeURIComponent(path)}`);
    if (
      response &&
      typeof response === "object" &&
      "file" in response &&
      response.file &&
      typeof response.file === "object" &&
      "review_state" in response.file &&
      response.file.review_state !== "approved"
    ) {
      return text({ ok: false, error: "Only approved context can be read by chatdata_read_context_file.", path });
    }

    return text(response);
  }
);

server.tool(
  "chatdata_propose_patch",
  "Propose a context file patch after hub guard checks.",
  {
    path: z.string().min(1),
    base_hash: z.string().optional(),
    new_markdown: z.string().min(1),
    purpose: z.string().optional()
  },
  async (input) => {
    if (!isSafeContextPath(input.path)) {
      return text(invalidContextPathResponse(input.path));
    }

    const config = await requireConfig();
    return text(await hubFetchOrQueue(config, "/context/patch/propose", {
      method: "POST",
      body: JSON.stringify(input)
    }, {
      tool: "chatdata_propose_patch",
      path: "/context/patch/propose",
      method: "POST",
      body: input
    }));
  }
);

server.tool(
  "chatdata_list_review_queue",
  "List pending patches and conflicts that need human review before they become trusted context.",
  {},
  async () => {
    const config = await requireConfig();
    return text(await hubFetch(config, "/context/review-queue"));
  }
);

server.tool(
  "chatdata_publish_patch",
  "Publish one reviewed pending patch by patch_id and refresh the local cache. This is an MCP tool, not a raw shell command.",
  {
    patch_id: z.string().min(1)
  },
  async ({ patch_id }) => {
    const config = await requireConfig();
    const response = await hubFetch(config, `/context/patch/${encodeURIComponent(patch_id)}/publish`, { method: "POST" });
    const pull = (await hubFetch(config, "/context/pull")) as ContextPullResponse;
    const contextFiles = await writeContextFiles(domainCachePath(config.domain), pull.files ?? []);
    config.last_pull_revision = pull.revision ?? config.last_pull_revision ?? null;
    await writeConfig(config);

    return text({
      ok: true,
      response,
      cache_refreshed: contextFiles.written.length,
      cached_count: contextFiles.cached.length,
      files: contextFiles.cached,
      last_pull_revision: config.last_pull_revision
    });
  }
);

server.tool(
  "chatdata_create_metric_card",
  "Create an approved trusted metric card in ChatData.",
  {
    id: z.string().min(1),
    definition: z.string().min(1),
    grain: z.string().optional(),
    filters: z.string().optional(),
    exclusions: z.string().optional(),
    caveats: z.string().optional(),
    owner: z.string().optional(),
    source: z.string().optional()
  },
  async (input) => {
    const config = await requireConfig();
    return text(await hubFetchOrQueue(config, "/context/metrics", {
      method: "POST",
      body: JSON.stringify(input)
    }, {
      tool: "chatdata_create_metric_card",
      path: "/context/metrics",
      method: "POST",
      body: input
    }));
  }
);

server.tool(
  "chatdata_save_answer_path",
  "Save an approved reusable answer path in ChatData.",
  {
    id: z.string().min(1),
    title: z.string().optional(),
    content: z.string().optional(),
    markdown: z.string().optional(),
    steps: z.array(z.string()).optional(),
    owner: z.string().optional()
  },
  async (input) => {
    const config = await requireConfig();
    return text(await hubFetchOrQueue(config, "/context/answer-paths", {
      method: "POST",
      body: JSON.stringify(input)
    }, {
      tool: "chatdata_save_answer_path",
      path: "/context/answer-paths",
      method: "POST",
      body: input
    }));
  }
);

server.tool(
  "chatdata_create_proof_receipt",
  "Create an approved evidence receipt in ChatData.",
  {
    id: z.string().optional(),
    title: z.string().min(1),
    summary: z.string().min(1),
    caveats: z.string().optional(),
    next_action: z.string().optional(),
    owner: z.string().optional(),
    source: z.string().optional()
  },
  async (input) => {
    const config = await requireConfig();
    return text(await hubFetchOrQueue(config, "/context/proof", {
      method: "POST",
      body: JSON.stringify(input)
    }, {
      tool: "chatdata_create_proof_receipt",
      path: "/context/proof",
      method: "POST",
      body: input
    }));
  }
);

server.tool(
  "chatdata_share_context",
  "Create an explicit same-domain activation link for an approved context file.",
  {
    path: z.string().min(1)
  },
  async (input) => {
    if (!isSafeContextPath(input.path)) {
      return text(invalidContextPathResponse(input.path));
    }

    const config = await requireConfig();
    return text(await hubFetch(config, "/context/share", { method: "POST", body: JSON.stringify(input) }));
  }
);

server.tool(
  "chatdata_diff_versions",
  "Return a line diff between two context file versions.",
  {
    path: z.string().min(1),
    v1: z.number().int().positive(),
    v2: z.number().int().positive()
  },
  async ({ path, v1, v2 }) => {
    if (!isSafeContextPath(path)) {
      return text(invalidContextPathResponse(path));
    }

    const config = await requireConfig();
    const params = new URLSearchParams({ path, v1: String(v1), v2: String(v2) });
    return text(await hubFetch(config, `/context/diff?${params.toString()}`));
  }
);

server.tool(
  "chatdata_rollback",
  "Restore a prior context file version as the new current version.",
  {
    path: z.string().min(1),
    version: z.number().int().positive()
  },
  async (input) => {
    if (!isSafeContextPath(input.path)) {
      return text(invalidContextPathResponse(input.path));
    }

    const config = await requireConfig();
    return text(await hubFetch(config, "/context/rollback", { method: "POST", body: JSON.stringify(input) }));
  }
);

server.tool("chatdata_list_conflicts", "List open context conflicts for this workspace.", {}, async () => {
  const config = await requireConfig();
  return text(await hubFetch(config, "/steward/conflicts"));
});

server.tool(
  "chatdata_resolve_conflict",
  "Resolve or dismiss a context conflict.",
  {
    conflict_id: z.string().min(1),
    patch_id: z.string().optional(),
    dismiss: z.boolean().optional()
  },
  async ({ conflict_id, patch_id, dismiss }) => {
    const config = await requireConfig();
    return text(await hubFetch(config, `/steward/conflicts/${encodeURIComponent(conflict_id)}/resolve`, {
      method: "POST",
      body: JSON.stringify({ patch_id, dismiss })
    }));
  }
);

server.tool("chatdata_list_members", "List workspace members in the same domain.", {}, async () => {
  const config = await requireConfig();
  return text(await hubFetch(config, "/workspace/members"));
});

server.tool("chatdata_export_bundle", "Export approved Markdown context as an explicit JSON bundle.", {}, async () => {
  const config = await requireConfig();
  return text(await hubFetch(config, "/context/export?confirm=true"));
});

const transport = new StdioServerTransport();
await autoPullOnStart();
await server.connect(transport);

async function readConfigResult(): Promise<ConfigReadResult> {
  try {
    const raw = await readFile(configPath, "utf8");
    return {
      config: JSON.parse(raw) as ChatDataConfig,
      config_exists: true,
      config_readable: true
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        config: null,
        config_exists: false,
        config_readable: false
      };
    }

    if (error instanceof SyntaxError) {
      return {
        config: null,
        config_exists: true,
        config_readable: false,
        error_code: "invalid_json",
        error: `ChatData config exists but is not valid JSON: ${error.message}`
      };
    }

    return {
      config: null,
      config_exists: true,
      config_readable: false,
      error_code: "config_read_failed",
      error: `ChatData config could not be read: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function readConfig(): Promise<ChatDataConfig | null> {
  const result = await readConfigResult();

  if (result.error) {
    throw new Error(`${result.error} ${configRepairNextAction()}`);
  }

  return result.config;
}

async function requireConfig(): Promise<ChatDataConfig> {
  const config = await readConfig();

  if (!config) {
    throw new Error("ChatData is not activated. Run chatdata_activate with a token from /activate.");
  }

  return config;
}

async function writeConfig(config: ChatDataConfig): Promise<void> {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}

async function writeContextFiles(targetDir: string, files: ContextFilePayload[], reconcileFullPull = false): Promise<ContextWriteResult> {
  const manifestEntries = await readManifestEntries(targetDir);
  const written: LocalContextFileSummary[] = [];
  const incomingPaths = new Set(files.map((file) => file.path));

  await mkdir(targetDir, { recursive: true });

  if (reconcileFullPull) {
    for (const [path, entry] of manifestEntries) {
      if (incomingPaths.has(path)) {
        continue;
      }

      await rm(entry.local_path, { force: true });
      manifestEntries.delete(path);
    }
  }

  for (const file of files) {
    if (!isSafeContextPath(file.path)) {
      throw new Error(`Hub returned unsafe context path: ${file.path}`);
    }

    const localPath = join(targetDir, file.path);
    await mkdir(dirname(localPath), { recursive: true });
    await writeFile(localPath, file.content, "utf8");
    const summary = {
      path: file.path,
      local_path: localPath,
      version: file.version,
      content_hash: file.content_hash
    };
    manifestEntries.set(file.path, summary);
    written.push(summary);
  }

  const cached = await listCachedContextFiles(targetDir, manifestEntries);

  await writeFile(
    join(targetDir, "manifest.json"),
    `${JSON.stringify(
      {
        pulled_at: new Date().toISOString(),
        pulled_count: written.length,
        cached_count: cached.length,
        files: cached
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  return { written, cached };
}

async function readManifestEntries(targetDir: string): Promise<Map<string, LocalContextFileSummary>> {
  try {
    const raw = await readFile(join(targetDir, "manifest.json"), "utf8");
    const parsed = JSON.parse(raw) as { files?: unknown };
    const entries = Array.isArray(parsed.files) ? parsed.files : [];
    const byPath = new Map<string, LocalContextFileSummary>();

    for (const entry of entries) {
      if (!entry || typeof entry !== "object" || !("path" in entry) || typeof entry.path !== "string") {
        continue;
      }

      if (!isSafeContextPath(entry.path)) {
        continue;
      }

      byPath.set(entry.path, {
        path: entry.path,
        local_path: "local_path" in entry && typeof entry.local_path === "string" ? entry.local_path : join(targetDir, entry.path),
        version: "version" in entry && typeof entry.version === "number" ? entry.version : null,
        content_hash: "content_hash" in entry && typeof entry.content_hash === "string" ? entry.content_hash : null
      });
    }

    return byPath;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ENOTDIR")
    ) {
      return new Map();
    }

    if (error instanceof SyntaxError) {
      return new Map();
    }

    throw error;
  }
}

async function listCachedContextFiles(
  targetDir: string,
  manifestEntries: Map<string, LocalContextFileSummary>
): Promise<LocalContextFileSummary[]> {
  const paths = await listMarkdownContextPaths(targetDir);

  return paths.map((path) => {
    const entry = manifestEntries.get(path);

    return {
      path,
      local_path: join(targetDir, path),
      version: entry?.version ?? null,
      content_hash: entry?.content_hash ?? null
    };
  });
}

async function listMarkdownContextPaths(targetDir: string, currentDir = targetDir): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(currentDir, { withFileTypes: true });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ENOTDIR")
    ) {
      return [];
    }

    throw error;
  }

  const paths: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = join(currentDir, entry.name);

    if (entry.isDirectory()) {
      paths.push(...await listMarkdownContextPaths(targetDir, entryPath));
      continue;
    }

    const contextPath = relative(targetDir, entryPath).replace(/\\/g, "/");

    if (isSafeContextPath(contextPath)) {
      paths.push(contextPath);
    }
  }

  return paths.sort((left, right) => left.localeCompare(right));
}

async function autoPullOnStart(): Promise<void> {
  const { config } = await readConfigResult();

  if (!config?.token) {
    return;
  }

  try {
    const query = config.last_pull_revision ? `?since_revision=${encodeURIComponent(config.last_pull_revision)}` : "";
    const response = (await hubFetch(config, `/context/pull${query}`)) as ContextPullResponse;
    await writeContextFiles(domainCachePath(config.domain), response.files ?? []);
    config.last_pull_revision = response.revision ?? config.last_pull_revision ?? null;
    await writeConfig(config);
  } catch {
    // Startup must not fail when the hub is offline; local-cache reads still work.
  }
}

async function verifyHubToken(hubUrl: string, token: string): Promise<Required<HubVerifyResponse>> {
  const response = await fetch(`${hubUrl}/auth/verify?token=${encodeURIComponent(token)}`);
  const payload = (await response.json()) as HubVerifyResponse;

  if (!response.ok || !payload.ok || !payload.token) {
    throw new Error(payload.error ?? `Hub token verification failed with HTTP ${response.status}.`);
  }

  return payload as Required<HubVerifyResponse>;
}

async function hubFetchOrQueue(
  config: ChatDataConfig,
  path: string,
  init: RequestInit,
  queueItem: LocalQueueItem
): Promise<unknown> {
  try {
    return await hubFetch(config, path, init);
  } catch (error) {
    if (error instanceof HubHttpError && error.status > 0 && error.status < 500) {
      throw error;
    }

    return queueLocalWrite(config, queueItem, error instanceof Error ? error.message : String(error));
  }
}

async function hubFetch(config: ChatDataConfig, path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(`${normalizeHubUrl(config.hub_url)}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });
  } catch (error) {
    throw new HubHttpError(`ChatData hub is unreachable: ${error instanceof Error ? error.message : String(error)}`, 0);
  }

  const payload = await safeJson(response);

  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? String(payload.error)
      : `Hub request failed with HTTP ${response.status}.`;
    const upgradeMessage = response.status === 402
      ? "Trial expired. Reads still work; upgrade billing to write new context."
      : message;

    throw new HubHttpError(upgradeMessage, response.status, payload);
  }

  return payload;
}

async function safeJson(response: Response): Promise<unknown> {
  const textBody = await response.text();

  if (!textBody) {
    return null;
  }

  try {
    return JSON.parse(textBody) as unknown;
  } catch {
    return { raw: textBody };
  }
}

async function queueLocalWrite(config: ChatDataConfig, item: LocalQueueItem, error: string): Promise<unknown> {
  const queuedAt = new Date().toISOString();
  const queueDir = join(domainCachePath(config.domain), ".queue");
  const safeTool = item.tool.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const queuePath = join(queueDir, `${queuedAt.replace(/[:.]/g, "-")}-${safeTool}.json`);
  const payload = {
    ok: false,
    queued: true,
    local_only: true,
    state: "local_only",
    reason: "hub_unavailable",
    error,
    queued_at: queuedAt,
    hub_url: config.hub_url,
    workspace_id: config.workspace_id,
    domain: config.domain,
    item,
    next_action: "The hub was unreachable. Retry this write after chatdata_doctor reports the hub is healthy."
  };

  await mkdir(queueDir, { recursive: true });
  await writeFile(queuePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return {
    ...payload,
    queue_path: queuePath
  };
}

function normalizeHubUrl(value: string): string {
  return value.replace(/\/$/, "");
}

function domainCachePath(domain: string): string {
  return join(cachePath, domain.split(".")[0].replace(/[^a-z0-9_-]/gi, "-").toLowerCase());
}

function isSafeContextPath(path: string): boolean {
  return /^[a-z0-9][a-z0-9/_-]*\.md$/i.test(path) && !path.includes("..") && !path.startsWith("/");
}

function invalidContextPathResponse(path: string): Record<string, unknown> {
  return {
    ok: false,
    error: "Invalid context path.",
    path,
    allowed_pattern: "relative Markdown context path, for example metrics/activation-rate.md",
    next_action: "Use a relative .md path under the workspace context. Absolute paths and parent-directory segments are blocked."
  };
}

function normalizeExpectedDomain(value?: string): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

function configRepairNextAction(): string {
  return "Open ChatData Settings, copy the terminal setup command, run it, then rerun chatdata_doctor.";
}

function text(value: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}
