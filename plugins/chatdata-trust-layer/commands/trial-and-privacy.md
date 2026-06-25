---
description: Explain trial status, privacy boundaries, metadata sync, tokens, and local state.
---

# Trial And Privacy

Use this when the user asks what ChatData stores, what it syncs, how trial gating works, or why a token/config exists.

Explain plainly:

- ChatData syncs approved metadata and context such as definitions, answer paths, caveats, source references, proof receipts, evals, and review state.
- ChatData does not need raw warehouse rows for the default trust-layer flow.
- Tokens live in `~/.chatdata/config.json` for local MCP access and should not be shown in screenshots.
- The MCP server stores config and approved metadata locally; it is not an OS sandbox, and host agents or shell commands run with the permissions the user grants.
- Settings controls login, consent, token copy, install repair, and account state.

Run `chatdata_doctor` when the user needs live status.
