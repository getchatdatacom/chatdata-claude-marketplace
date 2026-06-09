---
description: Later-stage command for publishing reviewed trust-layer context into an immutable Slack runtime bundle.
---

# Publish Slack Context

Slack is not the active ChatData product surface. Use this command only when Paras explicitly reactivates Slack as a team expansion surface.

Use this command when canonical trust-layer files are ready to turn into an immutable runtime bundle for the Slack app.

Before publishing, run `chatdata_doctor`, `chatdata_pull_context`, `chatdata_list_review_queue`, and `chatdata_run_context_steward`.

- Stop if pending patches, needs-rewrite items, or open steward conflicts affect the Slack bundle scope.
- Do not let packaging promote draft, pending, rejected, conflict, or needs-rewrite content.
- If the source repo has local trust-layer files that are not approved in ChatData MCP, label them draft-only and keep them out of the trusted runtime bundle.

If PyYAML is missing, install the plugin helper dependency first:

```bash
python3 -m pip install -r "${CLAUDE_PLUGIN_ROOT}/requirements.txt"
```

Run:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/bin/publish_bundle.py" <trust-layer-repo>
```

This publish is strict by default. Stop if `skills/customer-analytics-skill.md` or `sources/*.md` still contain placeholders, or if no filled source reference exists. `--allow-template-placeholders` is only for local smoke tests of the packaged demo scaffold.

After publish:

1. Report the manifest path, bundle version, and content hash.
2. List metric and answer-path counts.
3. Run a skeptical second pass against the published bundle:
   - confirm the bundle was built from the intended repo
   - confirm reviewed and draft paths kept their correct states
   - confirm no unreviewed path was promoted by packaging alone
   - confirm the approved file count matches `chatdata_pull_context` for the same workspace
4. Call out any draft-only metrics that still cannot be promoted.
