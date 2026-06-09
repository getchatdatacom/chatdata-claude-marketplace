---
description: Create a customer-owned ChatData trust-layer repo from the template.
---

# Bootstrap Repo

Use this command when the customer analytics engineer is ready to create the ChatData trust-layer repo for the pilot domain.

1. Confirm the target directory for the customer-owned repo.
2. Run:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/bin/bootstrap_repo.py" <target-dir>
```

3. Open the new repo and fill:
   - `skills/customer-analytics-skill.md`
   - one `sources/*.md` reference per governed domain or dataset
   - the owner mapping, dashboard URLs, and top-10-metric list
4. End by summarizing what still needs customer input before the first publish.

Required output:

- repo path
- copied template structure
- missing inputs list, including customer analytics skill and source references
- recommended next command
