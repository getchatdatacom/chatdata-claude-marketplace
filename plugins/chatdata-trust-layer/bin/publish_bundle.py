#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import shutil
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

try:
    import yaml
except ModuleNotFoundError:  # pragma: no cover - exercised by local smoke tests when PyYAML is absent
    yaml = None


PLACEHOLDER_PATTERN = re.compile(r"\[[^\]\n]+\]")


def sha256_for_paths(paths: list[Path], root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths):
        digest.update(path.relative_to(root).as_posix().encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def list_files(root: Path, pattern: str) -> list[Path]:
    return [path for path in root.glob(pattern) if path.is_file()]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def is_template_reference(path: Path) -> bool:
    text = read_text(path)
    return path.name.lower() == "readme.md" or path.name == "domain-reference-template.md" or re.search(r"(?m)^template:\s*true\s*$", text) is not None


def has_placeholders(path: Path) -> bool:
    return PLACEHOLDER_PATTERN.search(read_text(path)) is not None


def has_yaml_value(text: str, *keys: str) -> bool:
    for key in keys:
        match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+?)\s*$", text)
        if match and match.group(1).strip().strip("'\"") not in {"", "[]", "{}"}:
            return True
    return False


def validate_customer_ready(repo: Path) -> list[str]:
    errors: list[str] = []
    customer_skill = repo / "skills" / "customer-analytics-skill.md"
    if not customer_skill.exists():
        errors.append("Missing skills/customer-analytics-skill.md.")
    elif has_placeholders(customer_skill):
        errors.append("Customer analytics skill still contains placeholders.")

    sources_dir = repo / "sources"
    if not sources_dir.exists():
        errors.append("Missing sources/ directory.")
        source_refs: list[Path] = []
    else:
        source_refs = [
            path
            for pattern in ("*.md", "*.yaml", "*.yml")
            for path in sources_dir.glob(pattern)
            if path.is_file() and not is_template_reference(path)
        ]
    if not source_refs:
        errors.append("No filled source reference found under sources/. Copy domain-reference-template.md to sources/<domain>.md and replace placeholders.")
    for path in source_refs:
        text = read_text(path)
        if has_placeholders(path):
            errors.append(f"Source reference still contains placeholders: {path.relative_to(repo)}")
        if not has_yaml_value(text, "owner"):
            errors.append(f"Source reference is missing owner: {path.relative_to(repo)}")
        if not has_yaml_value(text, "domain", "id"):
            errors.append(f"Source reference is missing domain or id: {path.relative_to(repo)}")

    for path in sorted(list_files(repo, "metrics/*.yaml") + list_files(repo, "metrics/*.yml")):
        text = read_text(path)
        if not has_yaml_value(text, "trusted_query_path", "raw_sql_sot"):
            errors.append(f"Metric is missing trusted query or raw SQL SoT: {path.relative_to(repo)}")
        if not has_yaml_value(text, "trusted_dashboard_url", "verified_dashboard_sot", "verified_report_sot"):
            errors.append(f"Metric is missing dashboard or report SoT: {path.relative_to(repo)}")
        if not has_yaml_value(text, "freshness_rule", "freshness"):
            errors.append(f"Metric is missing freshness rule: {path.relative_to(repo)}")
        if "validation_tolerance:" not in text and not has_yaml_value(text, "validation_rule"):
            errors.append(f"Metric is missing validation rule: {path.relative_to(repo)}")

    return errors


def load_yaml(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        if yaml is not None:
            return to_jsonable(yaml.safe_load(handle))
        return to_jsonable(simple_yaml_load(handle.read()))


def simple_yaml_load(text: str):
    """Parse the small YAML subset used by the ChatData template repo."""

    lines = [
        line.rstrip()
        for line in text.splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    if not lines:
        return None
    value, _ = parse_yaml_block(lines, 0, indentation(lines[0]))
    return value


def parse_yaml_block(lines: list[str], index: int, indent: int):
    if index >= len(lines):
        return None, index
    stripped = lines[index][indent:]
    if stripped.startswith("- "):
        return parse_yaml_list(lines, index, indent)
    return parse_yaml_dict(lines, index, indent)


def parse_yaml_dict(lines: list[str], index: int, indent: int):
    result = {}
    while index < len(lines):
        current_indent = indentation(lines[index])
        if current_indent < indent:
            break
        if current_indent > indent:
            break
        stripped = lines[index][indent:]
        if stripped.startswith("- "):
            break
        key, raw_value = split_yaml_pair(stripped)
        index += 1
        if raw_value == "":
            if index < len(lines) and indentation(lines[index]) > indent:
                nested, index = parse_yaml_block(lines, index, indentation(lines[index]))
                result[key] = nested
            else:
                result[key] = None
        else:
            result[key] = parse_yaml_scalar(raw_value)
    return result, index


def parse_yaml_list(lines: list[str], index: int, indent: int):
    result = []
    while index < len(lines):
        current_indent = indentation(lines[index])
        if current_indent < indent:
            break
        if current_indent != indent:
            break
        stripped = lines[index][indent:]
        if not stripped.startswith("- "):
            break
        item_text = stripped[2:].strip()
        index += 1
        if item_text == "":
            item, index = parse_yaml_block(lines, index, indentation(lines[index]))
            result.append(item)
            continue
        if looks_like_yaml_pair(item_text):
            key, raw_value = split_yaml_pair(item_text)
            item = {key: parse_yaml_scalar(raw_value) if raw_value else None}
            if index < len(lines) and indentation(lines[index]) > indent:
                nested, index = parse_yaml_block(lines, index, indentation(lines[index]))
                if isinstance(nested, dict):
                    item.update(nested)
                else:
                    item[key] = nested
            result.append(item)
            continue
        result.append(parse_yaml_scalar(item_text))
    return result, index


def indentation(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def split_yaml_pair(text: str) -> tuple[str, str]:
    key, value = text.split(":", 1)
    return key.strip(), value.strip()


def looks_like_yaml_pair(text: str) -> bool:
    if ":" not in text:
        return False
    key, _ = text.split(":", 1)
    return bool(key.strip()) and " " not in key.strip()


def parse_yaml_scalar(value: str):
    if value == "":
        return None
    if value in {"[]", "{}"}:
        return [] if value == "[]" else {}
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [parse_yaml_scalar(item.strip()) for item in inner.split(",")]
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    lowered = value.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if lowered in {"null", "none", "~"}:
        return None
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value


def to_jsonable(value):
    if isinstance(value, dict):
        return {key: to_jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value


def copy_if_exists(source: Path, destination: Path) -> None:
    if not source.exists():
        return

    if source.is_dir():
        shutil.copytree(source, destination, dirs_exist_ok=True)
    else:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)


def build_metric(metric_path: Path) -> dict:
    payload = load_yaml(metric_path)
    return {
        "metricId": payload["metric_id"],
        "label": payload["label"],
        "definition": payload["definition"],
        "businessOwner": payload["business_owner"],
        "dataOwner": payload["data_owner"],
        "grain": payload["grain"],
        "timezone": payload["timezone"],
        "filters": payload.get("filters", []),
        "exclusions": payload.get("exclusions", []),
        "trustedDashboardUrl": payload.get("trusted_dashboard_url"),
        "trustedQueryPath": payload.get("trusted_query_path"),
        "trustedQueryBackend": payload.get("trusted_query_backend"),
        "freshnessRule": payload["freshness_rule"],
        "validationTolerance": {
            "pctDeltaMax": float(payload["validation_tolerance"]["pct_delta_max"])
        },
        "knownCaveats": payload.get("known_caveats", []),
        "clarificationRules": payload.get("clarification_rules", []),
        "escalationRules": payload.get("escalation_rules", []),
        "reviewStatus": payload["review_status"],
        "trustState": payload["trust_state"],
        "lastReviewedAt": payload["last_reviewed_at"],
    }


def build_answer_path(answer_path: Path) -> dict:
    payload = load_yaml(answer_path)
    slack_response = payload.get("slack_response", {})
    canonical_question = payload.get("canonical_question") or payload.get("question") or payload["answer_path_id"]
    answer_template = payload.get("answer_template")
    review_status = payload.get("review_status", "draft")
    expected_state = payload.get("expected_answer_state")
    if not expected_state:
        expected_state = "verified" if review_status in {"approved", "reviewed"} else "needs_review"
    default_next_action = payload.get("next_action") or "Review the evidence and caveats before reusing this answer path."

    return {
        "answerPathId": payload["answer_path_id"],
        "canonicalQuestion": canonical_question,
        "aliases": payload.get("aliases", []),
        "metricId": payload["metric"],
        "routeId": payload.get("route_id", payload["answer_path_id"]),
        "preferredDimensions": payload.get("preferred_dimensions", []),
        "retrievalPath": payload["query_or_retrieval_path"],
        "validationRoutine": payload.get("validation_routine", "needs owner review before auto-trusted reuse"),
        "benchmarkSourcePreference": payload.get("benchmark_source_preference", []),
        "caveats": payload.get("caveats", []),
        "expectedAnswerState": expected_state,
        "reviewStatus": review_status,
        "maturity": payload.get("maturity", payload.get("trust_state", "reviewed" if review_status in {"approved", "reviewed"} else "draft")),
        "recurrenceTier": payload.get("recurrence_tier", "unknown"),
        "businessValueTier": payload.get("business_value_tier", "unknown"),
        "backend": payload.get("backend"),
        "defaultDateRange": payload.get("default_date_range"),
        "expectedShape": payload.get("expected_shape"),
        "answerTemplate": answer_template,
        "owner": payload.get("owner"),
        "slackResponse": {
            "draft": slack_response.get("draft", answer_template or canonical_question),
            "benchmarked": slack_response.get("benchmarked"),
            "verified": slack_response.get("verified", answer_template or canonical_question),
            "trusted": slack_response.get("trusted"),
            "needsReview": slack_response.get("needs_review"),
            "nextActionDraft": slack_response.get("next_action_draft", default_next_action),
            "nextActionVerified": slack_response.get("next_action_verified", default_next_action),
            "nextActionTrusted": slack_response.get("next_action_trusted"),
            "evidenceDraft": slack_response.get("evidence_draft", []),
            "evidenceVerified": slack_response.get("evidence_verified", []),
            "benchmarkLinkKeywords": slack_response.get("benchmark_link_keywords", []),
            "screenshotKeywords": slack_response.get("screenshot_keywords", []),
        },
    }


def build_trusted_artifacts(artifacts_path: Path) -> list[dict]:
    if not artifacts_path.exists():
        return []

    payload = load_yaml(artifacts_path) or {}
    artifacts = payload.get("trusted_artifacts", [])
    return [
        {
            "artifactId": artifact["artifact_id"],
            "metricId": artifact["metric_id"],
            "label": artifact["label"],
            "sourceType": artifact["source_type"],
            "url": artifact.get("url"),
            "queryPath": artifact.get("query_path"),
            "freshness": artifact["freshness"],
            "currentValue": float(artifact["current_value"]),
            "previousValue": float(artifact["previous_value"]),
            "tolerancePct": float(artifact["tolerance_pct"]),
            "dimensions": artifact.get("dimensions", []),
            "lastValidatedAt": artifact["last_validated_at"],
        }
        for artifact in artifacts
    ]


def guess_route_id(question: str) -> str:
    normalized = question.lower()
    if "real" in normalized or "data issue" in normalized or "dashboard issue" in normalized:
        return "movement-real-or-data-issue"
    if "mobile paid search" in normalized or "paid search" in normalized:
        return "mobile-paid-search-follow-up"
    if "segment" in normalized or "channel" in normalized or "device" in normalized or "market" in normalized:
        return "segment-driver"
    return "self-serve-conversion-drop"


def build_eval_questions(evals_path: Path) -> list[dict]:
    if not evals_path.exists():
        return []

    payload = load_yaml(evals_path) or {}
    context_oracles = payload.get("context_oracles", {})
    eval_cases = payload.get("eval_cases", [])
    if isinstance(eval_cases, list) and eval_cases:
        results = []
        for index, case in enumerate(eval_cases, start=1):
            if not isinstance(case, dict):
                continue
            oracle_id = str(case.get("oracle_id") or "").strip()
            oracle = context_oracles.get(oracle_id, {}) if isinstance(context_oracles, dict) else {}
            if not isinstance(oracle, dict):
                oracle = {}
            case = {**oracle, **case}
            question = str(case.get("canonical_question") or case.get("question") or "").strip()
            if not question:
                continue
            results.append(
                {
                    "evalId": str(case.get("eval_id") or f"generated-eval-{index:02d}"),
                    "contextOracleId": oracle_id or None,
                    "canonicalQuestion": question,
                    "expectedRouteId": str(case.get("expected_route_id") or guess_route_id(question)),
                    "expectedMetricId": str(case.get("expected_metric_id") or "self_serve_conversion"),
                    "requiredFilters": case.get("required_filters", []),
                    "expectedCaveats": case.get("expected_caveats", []),
                    "validationReference": str(case.get("validation_reference") or ""),
                    "acceptedAnswerStates": case.get("accepted_answer_states", ["verified"]),
                    "requiredContextIds": case.get("required_context_ids", []),
                    "eligibleContextIds": case.get("eligible_context_ids", []),
                    "retrievedContextIds": case.get("retrieved_context_ids", []),
                    "appliedContextIds": case.get("applied_context_ids", []),
                    "conflictingContextIds": case.get("conflicting_context_ids", []),
                    "failureLayer": case.get("failure_layer", []),
                    "ablationBundleIds": case.get("ablation_bundle_ids", []),
                    "productionAuditSampleRate": case.get("production_audit_sample_rate"),
                    "productionAuditRiskTier": case.get("production_audit_risk_tier"),
                }
            )
        return results

    questions = payload.get("questions", [])
    results = []
    for index, question in enumerate(questions, start=1):
        route_id = guess_route_id(question)
        accepted = ["verified"]
        if route_id == "mobile-paid-search-follow-up":
            accepted = ["draft", "benchmarked", "needs_review"]
        elif route_id == "segment-driver":
            accepted = ["verified", "trusted"]

        results.append(
            {
                "evalId": f"generated-eval-{index:02d}",
                "canonicalQuestion": question,
                "expectedRouteId": route_id,
                "expectedMetricId": "self_serve_conversion",
                "requiredFilters": ["weekly business review period", "exclude test accounts"],
                "expectedCaveats": ["campaign tagging changed during the same period"],
                "validationReference": "weekly-dashboard-self-serve-conversion",
                "acceptedAnswerStates": accepted,
            }
        )
    return results


def maybe_post_bundle(runtime_url: Optional[str], admin_token: Optional[str], bundle: dict) -> None:
    if not runtime_url or not admin_token:
        return

    request = urllib.request.Request(
        runtime_url.rstrip("/") + "/admin/publish-bundle",
        data=json.dumps(bundle).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        body = response.read().decode("utf-8")
        print(f"Runtime publish response: {body}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Render an immutable ChatData Slack bundle from canonical repo files."
    )
    default_repo = Path(__file__).resolve().parents[1] / "assets" / "template-repo"
    parser.add_argument(
        "repo_path",
        nargs="?",
        default=str(default_repo),
        help="Path to the trust-layer repo. Defaults to the plugin template repo.",
    )
    parser.add_argument("--customer-id", default="demo-open-door-like")
    parser.add_argument("--workspace-id", default="demo-slack-workspace")
    parser.add_argument(
        "--pilot-domain",
        default="seller-funnel-weekly-business-review",
    )
    parser.add_argument(
        "--runtime-url",
        default=None,
        help="Optional ChatData runtime URL. If set with --admin-token, publish will POST the bundle to the runtime.",
    )
    parser.add_argument(
        "--admin-token",
        default=None,
        help="Admin token for runtime publish.",
    )
    parser.add_argument(
        "--allow-template-placeholders",
        action="store_true",
        help="Allow publishing the packaged demo template even when customer-specific skill/source placeholders remain.",
    )
    args = parser.parse_args()

    repo = Path(args.repo_path).expanduser().resolve()
    if not args.allow_template_placeholders:
        errors = validate_customer_ready(repo)
        if errors:
            raise SystemExit("Trust-layer repo is not customer-ready:\n- " + "\n- ".join(errors))

    published = repo / "published"

    if published.exists():
        shutil.rmtree(published)
    published.mkdir(parents=True, exist_ok=True)

    metric_files = list_files(repo, "metrics/*.yaml")
    answer_path_files = list_files(repo, "answer-paths/*.yaml")
    trusted_query_files = list_files(repo, "queries/trusted/*.sql")
    generated_query_files = list_files(repo, "queries/generated/*.sql")
    analytics_skill_files = list_files(repo, "skills/*.md")
    source_reference_files = list_files(repo, "sources/*.md") + list_files(repo, "sources/*.yaml") + list_files(repo, "sources/*.yml")
    source_files = (
        metric_files
        + answer_path_files
        + trusted_query_files
        + generated_query_files
        + analytics_skill_files
        + source_reference_files
        + list_files(repo, "artifacts/*.yaml")
        + list_files(repo, "catalog/*.yaml")
        + list_files(repo, "evals/*.yaml")
    )
    artifact_hash = sha256_for_paths(source_files, repo) if source_files else "empty-bundle"
    published_at = datetime.now(timezone.utc).isoformat()

    manifest = {
        "schemaVersion": "1.0.0",
        "bundleVersion": published_at,
        "customerId": args.customer_id,
        "workspaceId": args.workspace_id,
        "sourceCommit": "local-working-tree",
        "publishedAt": published_at,
        "artifactHash": artifact_hash,
        "compatibilityVersion": "1",
        "metricsCount": len(metric_files),
        "answerPathsCount": len(answer_path_files),
        "analyticsSkillsCount": len(analytics_skill_files),
        "sourceReferencesCount": len([path for path in source_reference_files if not is_template_reference(path)]),
    }

    bundle = {
        "manifest": manifest,
        "pilotDomain": args.pilot_domain,
        "metrics": [build_metric(path) for path in sorted(metric_files)],
        "trustedArtifacts": build_trusted_artifacts(repo / "artifacts" / "trusted_artifacts.yaml"),
        "answerPaths": [build_answer_path(path) for path in sorted(answer_path_files)],
        "evalQuestions": build_eval_questions(repo / "evals" / "recurring_questions.yaml"),
    }

    for relative in [
        "metrics",
        "answer-paths",
        "queries",
        "artifacts",
        "catalog",
        "evals",
        "skills",
        "sources",
        "scripts",
    ]:
        copy_if_exists(repo / relative, published / relative)

    metrics_index = [
        {"path": path.relative_to(repo).as_posix(), "name": path.stem}
        for path in sorted(metric_files)
    ]
    answer_paths_index = [
        {"path": path.relative_to(repo).as_posix(), "name": path.stem}
        for path in sorted(answer_path_files)
    ]

    (published / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (published / "metrics_index.json").write_text(json.dumps(metrics_index, indent=2) + "\n", encoding="utf-8")
    (published / "answer_paths.json").write_text(
        json.dumps(answer_paths_index, indent=2) + "\n", encoding="utf-8"
    )
    (published / "slack_context.json").write_text(json.dumps(bundle, indent=2) + "\n", encoding="utf-8")

    maybe_post_bundle(args.runtime_url, args.admin_token, bundle)

    print(f"Published bundle at {published}")
    print(f"Metrics: {len(metric_files)}")
    print(f"Answer paths: {len(answer_path_files)}")
    print(f"Artifact hash: {artifact_hash}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
