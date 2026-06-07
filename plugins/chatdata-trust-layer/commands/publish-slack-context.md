---
description: Publish reviewed trust-layer context into an immutable Slack runtime bundle.
---

# Publish Slack Context

Use this command when canonical trust-layer files are ready to turn into an immutable runtime bundle for the Slack app.

If PyYAML is missing, install the plugin helper dependency first:

```bash
python3 -m pip install -r "${CLAUDE_PLUGIN_ROOT}/requirements.txt"
```

Run:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/bin/publish_bundle.py" <trust-layer-repo>
```

After publish:

1. Report the manifest path, bundle version, and content hash.
2. List metric and answer-path counts.
3. Run a skeptical second pass against the published bundle:
   - confirm the bundle was built from the intended repo
   - confirm reviewed and draft paths kept their correct states
   - confirm no unreviewed path was promoted by packaging alone
4. Call out any draft-only metrics that still cannot be promoted.
