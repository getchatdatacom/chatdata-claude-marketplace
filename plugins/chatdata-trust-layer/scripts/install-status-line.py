#!/usr/bin/env python3
"""Install the ChatData Claude Code status line as the default footer."""

from __future__ import annotations

import argparse
import json
import shlex
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def read_json(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return default
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        print(f"Claude settings JSON is corrupt: {path}: {exc}", file=sys.stderr)
        raise SystemExit(2)
    if not isinstance(data, dict):
        print(f"Claude settings JSON must be an object: {path}", file=sys.stderr)
        raise SystemExit(2)
    return data


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")


def status_command(status_script: Path) -> dict[str, str]:
    return {
        "type": "command",
        "command": "node " + shlex.quote(str(status_script)),
    }


def status_line_command(settings: dict[str, Any]) -> str:
    status_line = settings.get("statusLine")
    if isinstance(status_line, dict):
        command = status_line.get("command")
        return command if isinstance(command, str) else ""
    return ""


def install_default_status_line(settings_path: Path, status_script: Path) -> bool:
    settings = read_json(settings_path, {})
    previous = settings.get("statusLine")
    previous_command = status_line_command(settings)
    chatdata_settings = settings.get("chatdata")
    if not isinstance(chatdata_settings, dict):
        chatdata_settings = {}

    if previous and "chatdata-status-line.js" not in previous_command and "previousStatusLine" not in chatdata_settings:
        chatdata_settings["previousStatusLine"] = previous
        chatdata_settings["previousStatusLineBackedUpAt"] = datetime.now(timezone.utc).isoformat()

    chatdata_settings["statusLineDefault"] = True
    chatdata_settings["statusLineInstalledAt"] = datetime.now(timezone.utc).isoformat()
    settings["chatdata"] = chatdata_settings
    settings["statusLine"] = status_command(status_script)
    write_json(settings_path, settings)
    return bool(previous and "chatdata-status-line.js" not in previous_command)


def local_settings_paths(workspace: Path) -> list[Path]:
    paths: list[Path] = []
    current = workspace.resolve()
    while True:
        paths.append(current / ".claude" / "settings.local.json")
        if current == current.parent:
            break
        current = current.parent
    return paths


def repair_stale_local_pointers(workspace: Path, status_script: Path) -> list[Path]:
    repaired: list[Path] = []
    seen: set[Path] = set()
    for path in local_settings_paths(workspace):
        resolved = path.resolve()
        if resolved in seen or not path.exists():
            continue
        seen.add(resolved)
        settings = read_json(path, {})
        if "chatdata-status-line.js" not in status_line_command(settings):
            continue
        settings["statusLine"] = status_command(status_script)
        write_json(path, settings)
        repaired.append(path)
    return repaired


def find_local_status_line_overrides(workspace: Path) -> list[tuple[Path, str]]:
    overrides: list[tuple[Path, str]] = []
    seen: set[Path] = set()
    for path in local_settings_paths(workspace):
        resolved = path.resolve()
        if resolved in seen or not path.exists():
            continue
        seen.add(resolved)
        settings = read_json(path, {})
        command = status_line_command(settings)
        if command and "chatdata-status-line.js" not in command:
            overrides.append((path, command))
    return overrides


def main() -> int:
    parser = argparse.ArgumentParser(description="Install ChatData as the Claude Code status line.")
    parser.add_argument("--claude-home", default=str(Path.home() / ".claude"))
    parser.add_argument("--workspace", default=str(Path.cwd()))
    parser.add_argument("--plugin-root", default=str(Path(__file__).resolve().parents[1]))
    args = parser.parse_args()

    claude_home = Path(args.claude_home).expanduser().resolve()
    workspace = Path(args.workspace).expanduser().resolve()
    plugin_root = Path(args.plugin_root).expanduser().resolve()
    status_script = plugin_root / "scripts" / "chatdata-status-line.js"
    if not status_script.exists():
        print(f"ChatData status line script is missing: {status_script}", file=sys.stderr)
        return 2

    settings_path = claude_home / "settings.json"
    backed_up_previous = install_default_status_line(settings_path, status_script)
    repaired = repair_stale_local_pointers(workspace, status_script)
    overrides = find_local_status_line_overrides(workspace)

    print("ChatData status line installed.")
    print(f"- Claude settings: {settings_path}")
    print(f"- Status line: {status_script}")
    if backed_up_previous:
        print("- Previous statusLine backed up under chatdata.previousStatusLine.")
    if repaired:
        print("- Repaired stale local statusLine pointers:")
        for path in repaired:
            print(f"  - {path}")
    if overrides:
        print("- Warning: project-local statusLine overrides can hide the ChatData footer in this workspace:")
        for path, command in overrides:
            print(f"  - {path}: {command}")
        print("  Remove the local override or move it under chatdata.previousStatusLine if ChatData should own this project footer.")
    print("Run /reload-plugins or restart Claude Code to apply the footer in the current session.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
