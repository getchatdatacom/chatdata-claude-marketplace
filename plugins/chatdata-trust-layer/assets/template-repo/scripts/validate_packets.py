#!/usr/bin/env python3
import argparse
import re
from pathlib import Path
import sys


PLACEHOLDER_PATTERN = re.compile(r"\[[^\]\n]+\]")


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


def first_yaml_value(text: str, *keys: str) -> str:
    for key in keys:
        match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+?)\s*$", text)
        if not match:
            continue
        value = match.group(1).strip().strip("'\"")
        if value and value not in {"[]", "{}"}:
            return value
    return ""


def validate_referenced_paths(root: Path) -> list[str]:
    errors: list[str] = []
    for path in sorted((root / "metrics").glob("*.yaml")) + sorted((root / "metrics").glob("*.yml")):
        text = read_text(path)
        query_path = first_yaml_value(text, "trusted_query_path", "raw_sql_sot")
        if query_path.startswith("queries/") and not (root / query_path).exists():
            errors.append(f"Metric references missing query path: {path.relative_to(root)} -> {query_path}")

    for path in sorted((root / "answer-paths").glob("*.yaml")) + sorted((root / "answer-paths").glob("*.yml")):
        text = read_text(path)
        query_path = first_yaml_value(text, "query_or_retrieval_path", "retrieval_path")
        if query_path.startswith("queries/") and not (root / query_path).exists():
            errors.append(f"Answer path references missing query path: {path.relative_to(root)} -> {query_path}")
    return errors


def validate_customer_ready(root: Path) -> list[str]:
    errors: list[str] = []
    customer_skill = root / "skills" / "customer-analytics-skill.md"
    if has_placeholders(customer_skill):
        errors.append("Customer analytics skill still contains placeholders.")

    source_refs = [
        path
        for pattern in ("*.md", "*.yaml", "*.yml")
        for path in (root / "sources").glob(pattern)
        if path.is_file() and not is_template_reference(path)
    ]
    if not source_refs:
        errors.append("No filled source reference found under sources/. Copy domain-reference-template.md to sources/<domain>.md and replace placeholders.")
    for path in source_refs:
        if has_placeholders(path):
            errors.append(f"Source reference still contains placeholders: {path.relative_to(root)}")
        text = read_text(path)
        if not has_yaml_value(text, "owner"):
            errors.append(f"Source reference is missing owner: {path.relative_to(root)}")
        if not has_yaml_value(text, "domain", "id"):
            errors.append(f"Source reference is missing domain or id: {path.relative_to(root)}")

    for path in sorted((root / "metrics").glob("*.yaml")) + sorted((root / "metrics").glob("*.yml")):
        text = read_text(path)
        if not has_yaml_value(text, "trusted_query_path", "raw_sql_sot"):
            errors.append(f"Metric is missing trusted query or raw SQL SoT: {path.relative_to(root)}")
        if not has_yaml_value(text, "trusted_dashboard_url", "verified_dashboard_sot", "verified_report_sot"):
            errors.append(f"Metric is missing dashboard or report SoT: {path.relative_to(root)}")
        if not has_yaml_value(text, "freshness_rule", "freshness"):
            errors.append(f"Metric is missing freshness rule: {path.relative_to(root)}")
        if "validation_tolerance:" not in text and not has_yaml_value(text, "validation_rule"):
            errors.append(f"Metric is missing validation rule: {path.relative_to(root)}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a ChatData trust-layer template or customer repo.")
    parser.add_argument(
        "--customer-ready",
        action="store_true",
        help="Fail when customer-specific analytics skill/source files still contain placeholders or lack required SoT fields.",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent
    required = [
        root / "metrics",
        root / "answer-paths",
        root / "queries" / "trusted",
        root / "queries" / "generated",
        root / "artifacts",
        root / "evals",
        root / "catalog",
        root / "skills",
        root / "sources",
        root / "skills" / "customer-analytics-skill.md",
        root / "sources" / "domain-reference-template.md",
    ]
    missing = [path for path in required if not path.exists()]
    if missing:
        for path in missing:
            print(f"Missing required path: {path}", file=sys.stderr)
        return 1

    reference_errors = validate_referenced_paths(root)
    if reference_errors:
        for error in reference_errors:
            print(error, file=sys.stderr)
        return 1

    if args.customer_ready:
        errors = validate_customer_ready(root)
        if errors:
            for error in errors:
                print(error, file=sys.stderr)
            return 1
        print("Trust-layer customer repo looks publish-ready.")
        return 0

    print("Trust-layer template looks structurally valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
