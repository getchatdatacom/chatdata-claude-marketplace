#!/usr/bin/env python3
"""Build shared ChatData onboarding patches from a trust-layer repo."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


def slugify(value: str, fallback: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] or fallback


def first_yaml_value(text: str, *keys: str) -> str:
    for key in keys:
        match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+?)\s*$", text)
        if not match:
            continue
        value = match.group(1).strip().strip("'\"")
        if value and value not in {"[]", "{}"}:
            return value
    return ""


def list_files(root: Path, patterns: Iterable[str]) -> list[Path]:
    files: list[Path] = []
    for pattern in patterns:
        files.extend(path for path in root.glob(pattern) if path.is_file())
    return sorted(set(files))


def read_small(path: Path, max_chars: int = 80_000) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    return text[:max_chars]


def metric_rows(repo: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for path in list_files(repo, ["metrics/*.yaml", "metrics/*.yml", "metrics/*.md"]):
        text = read_small(path)
        metric_id = first_yaml_value(text, "metric_id", "id") or path.stem
        rows.append(
            {
                "path": path.relative_to(repo).as_posix(),
                "id": metric_id,
                "label": first_yaml_value(text, "label", "title") or metric_id,
                "owner": first_yaml_value(text, "business_owner", "owner"),
                "data_owner": first_yaml_value(text, "data_owner"),
                "grain": first_yaml_value(text, "grain"),
                "source": first_yaml_value(text, "trusted_dashboard_url", "trusted_query_path", "source"),
                "review_status": first_yaml_value(text, "review_status", "trust_state"),
            }
        )
    return rows


def answer_path_rows(repo: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for path in list_files(repo, ["answer-paths/*.yaml", "answer-paths/*.yml", "answer-paths/*.md"]):
        text = read_small(path)
        answer_id = first_yaml_value(text, "answer_path_id", "id") or path.stem
        rows.append(
            {
                "path": path.relative_to(repo).as_posix(),
                "id": answer_id,
                "question": first_yaml_value(text, "canonical_question", "title") or answer_id,
                "metric": first_yaml_value(text, "metric", "metric_id"),
                "retrieval_path": first_yaml_value(text, "query_or_retrieval_path", "retrieval_path"),
                "review_status": first_yaml_value(text, "review_status", "expected_answer_state"),
            }
        )
    return rows


def source_rows(repo: Path) -> list[dict[str, str]]:
    source_paths = list_files(
        repo,
        [
            "artifacts/*.yaml",
            "artifacts/*.yml",
            "artifacts/*.md",
            "catalog/*.yaml",
            "catalog/*.yml",
            "catalog/*.md",
            "sources/*.yaml",
            "sources/*.yml",
            "sources/*.md",
            "queries/trusted/*.sql",
            "queries/generated/*.sql",
        ],
    )
    return [
        {
            "path": path.relative_to(repo).as_posix(),
            "kind": path.parent.name,
            "status": "present",
        }
        for path in source_paths
    ]


def eval_count(repo: Path) -> int:
    count = 0
    for path in list_files(repo, ["evals/*.yaml", "evals/*.yml", "evals/*.md"]):
        text = read_small(path)
        count += len(re.findall(r"(?m)^\s*-\s+", text))
    return count


def markdown_table(headers: list[str], rows: list[list[str]], empty: str) -> str:
    if not rows:
        return empty
    table = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        table.append("| " + " | ".join(cell.replace("\n", " ").strip() or "Missing" for cell in row) + " |")
    return "\n".join(table)


def frontmatter(file_id: str, context_type: str, owner: str) -> str:
    rows = {
        "id": file_id,
        "type": context_type,
        "review_state": "pending_review",
        "owner": owner,
        "source": "chatdata-onboarding",
    }
    body = "\n".join(f"{key}: {value}" for key, value in rows.items() if value)
    return f"---\n{body}\n---\n\n"


def build_shared_packet(
    repo: Path,
    *,
    workspace: str,
    pilot_domain: str,
    owner: str,
    generated_at: str,
) -> str:
    metrics = metric_rows(repo)
    answer_paths = answer_path_rows(repo)
    sources = source_rows(repo)
    questions = eval_count(repo)
    metric_table = markdown_table(
        ["Metric", "Owner", "Grain", "Source", "Review"],
        [[row["id"], row["owner"], row["grain"], row["source"], row["review_status"]] for row in metrics],
        "No metric packets found yet.",
    )
    answer_table = markdown_table(
        ["Answer path", "Metric", "Retrieval", "Review"],
        [[row["question"], row["metric"], row["retrieval_path"], row["review_status"]] for row in answer_paths],
        "No answer paths found yet.",
    )
    source_table = markdown_table(
        ["Source", "Kind", "Status"],
        [[row["path"], row["kind"], row["status"]] for row in sources[:25]],
        "No source references found yet.",
    )

    return (
        frontmatter("shared-onboarding-packet", "onboarding", owner)
        + f"# Shared ChatData Onboarding Packet\n\n"
        + "This packet is the workspace handoff for every ChatData MCP and plugin user. "
        + "It turns the first user's setup work into shared context that future users pull before analysis.\n\n"
        + "## Scope\n\n"
        + f"- Workspace: {workspace}\n"
        + f"- Pilot domain: {pilot_domain}\n"
        + f"- Generated at: {generated_at}\n"
        + f"- Trust repo: {repo}\n\n"
        + "## Current Counts\n\n"
        + f"- Metric packets: {len(metrics)}\n"
        + f"- Answer paths: {len(answer_paths)}\n"
        + f"- Source references: {len(sources)}\n"
        + f"- Eval questions observed: {questions}\n\n"
        + "## Metrics To Reuse\n\n"
        + metric_table
        + "\n\n## Answer Paths To Reuse\n\n"
        + answer_table
        + "\n\n## Source Inventory\n\n"
        + source_table
        + "\n\n## Shared Next Actions\n\n"
        + "1. Confirm the 10 metrics that must return the same answer for this workspace.\n"
        + "2. Fill missing owners, grain, freshness rules, and caveats before promoting paths to trusted.\n"
        + "3. Save reusable corrections through MCP so every plugin user and Slack surface pulls the same context.\n"
        + "4. Record a proof receipt after the first trusted answer or onboarding review passes.\n\n"
        + "## Multiplayer Rule\n\n"
        + "A user's onboarding work is not complete until the reusable pieces are proposed or saved through MCP. "
        + "Local files and chat transcripts are only working notes. Shared context lives in approved metric packets, "
        + "answer paths, source references, decisions, playbooks, evals, and proof receipts that every client can pull.\n"
    )


def build_source_inventory(repo: Path, *, workspace: str, owner: str) -> str:
    sources = source_rows(repo)
    source_table = markdown_table(
        ["Path", "Kind", "Status"],
        [[row["path"], row["kind"], row["status"]] for row in sources],
        "No source references found yet.",
    )
    return (
        frontmatter("onboarding-source-inventory", "source_reference", owner)
        + "# Onboarding Source Inventory\n\n"
        + f"Workspace: {workspace}\n\n"
        + "Use this as the first source map for new ChatData MCP and plugin users. "
        + "It should point to trusted dashboards, model or query paths, source docs, and owner-approved context.\n\n"
        + source_table
        + "\n\n## Gaps To Close\n\n"
        + "- Add the blessed dashboard or report for every top metric.\n"
        + "- Add the benchmark query or model path when it exists.\n"
        + "- Mark missing or draft-only sources plainly so agents do not claim fake proof.\n"
    )


def build_scope_decision(repo: Path, *, workspace: str, pilot_domain: str, owner: str) -> str:
    metrics = metric_rows(repo)
    metric_ids = [row["id"] for row in metrics[:10]]
    metric_list = "\n".join(f"- {metric_id}" for metric_id in metric_ids) or "- Missing"
    return (
        frontmatter("onboarding-scope", "decision", owner)
        + "# Onboarding Scope\n\n"
        + f"Workspace: {workspace}\n\n"
        + f"Pilot domain: {pilot_domain}\n\n"
        + "## Current Top Metrics\n\n"
        + metric_list
        + "\n\n## Decision\n\n"
        + "Keep onboarding scoped to the first 10 decision-critical metrics. "
        + "Do not expand into broad warehouse chat until these metrics have owners, trusted sources, answer paths, evals, and proof receipts.\n\n"
        + "## Expansion Gate\n\n"
        + "Expand only after the workspace has at least one repeated question answered or clarified against approved context, "
        + "with proof recorded and no unresolved duplicate definition for the metric.\n"
    )


def build_sync_playbook(*, owner: str) -> str:
    return (
        frontmatter("onboarding-sync-loop", "playbook", owner)
        + "# Onboarding Sync Loop\n\n"
        + "Use this playbook after any first-session setup, customer onboarding call, or trust-layer repair.\n\n"
        + "1. Run `chatdata_doctor` and stop on workspace, consent, token, or hub errors.\n"
        + "2. Run `chatdata_pull_context` so the session starts from approved shared state.\n"
        + "3. Search for duplicate metrics, answer paths, sources, decisions, and caveats before writing.\n"
        + "4. Save reviewed reusable context through the smallest MCP write tool.\n"
        + "5. Use `chatdata_propose_patch` when owner review is needed.\n"
        + "6. Run `/chatdata:audit-context` or `/chatdata:proof` before calling the onboarding work reusable.\n\n"
        + "If useful onboarding context stays only in one user's chat, the workspace has not learned it yet.\n"
    )


def build_patches(repo: Path, workspace: str, pilot_domain: str, owner: str) -> list[dict[str, str]]:
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    return [
        {
            "path": "onboarding/shared-onboarding-packet.md",
            "purpose": "Share first-session onboarding state with every ChatData MCP and plugin user.",
            "new_markdown": build_shared_packet(
                repo,
                workspace=workspace,
                pilot_domain=pilot_domain,
                owner=owner,
                generated_at=generated_at,
            ),
        },
        {
            "path": "sources/onboarding-source-inventory.md",
            "purpose": "Make the onboarding source map available through shared context.",
            "new_markdown": build_source_inventory(repo, workspace=workspace, owner=owner),
        },
        {
            "path": "decisions/onboarding-scope.md",
            "purpose": "Record the agreed onboarding scope and expansion gate.",
            "new_markdown": build_scope_decision(
                repo,
                workspace=workspace,
                pilot_domain=pilot_domain,
                owner=owner,
            ),
        },
        {
            "path": "playbooks/onboarding-sync-loop.md",
            "purpose": "Teach every user how onboarding learnings become shared MCP context.",
            "new_markdown": build_sync_playbook(owner=owner),
        },
    ]


def parse_args() -> argparse.Namespace:
    default_repo = Path(__file__).resolve().parents[1] / "assets" / "template-repo"
    parser = argparse.ArgumentParser(description="Build shared ChatData onboarding MCP patch payloads.")
    parser.add_argument("repo_path", nargs="?", default=str(default_repo))
    parser.add_argument("--workspace", default="current workspace")
    parser.add_argument("--pilot-domain", default="10 metric trust layer")
    parser.add_argument("--owner", default="chatdata")
    parser.add_argument("--write-dir", type=Path, default=None)
    parser.add_argument("--include-markdown", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo = Path(args.repo_path).expanduser().resolve()
    if not repo.exists():
        raise SystemExit(f"Trust-layer repo not found: {repo}")

    patches = build_patches(repo, args.workspace, args.pilot_domain, args.owner)
    written: list[str] = []
    if args.write_dir:
        output_dir = args.write_dir.expanduser().resolve()
        for patch in patches:
            output_path = output_dir / patch["path"]
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(patch["new_markdown"], encoding="utf-8")
            written.append(str(output_path))

    payload_patches = []
    for patch in patches:
        compact = {key: value for key, value in patch.items() if args.include_markdown or key != "new_markdown"}
        compact["tool"] = "chatdata_propose_patch"
        payload_patches.append(compact)

    payload = {
        "ok": True,
        "repo_path": str(repo),
        "counts": {
            "metrics": len(metric_rows(repo)),
            "answer_paths": len(answer_path_rows(repo)),
            "sources": len(source_rows(repo)),
            "eval_questions": eval_count(repo),
        },
        "patches": payload_patches,
        "written": written,
        "next_action": (
            "Review each patch, then call chatdata_propose_patch with path, purpose, and new_markdown "
            "so onboarding becomes shared MCP context."
        ),
    }
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
