# Changelog

## Unreleased

- bumped the plugin manifest to `0.3.22`; all 30 eval cases now publish with context oracles, and hosted/local MCP can record retrieval funnels, context ablations, and confidence-bounded production audits
- bumped the plugin manifest to `0.3.21` after production QA; metric preflight now treats source hints and stale context as blocking gates and names freshness in the required output
- bumped the plugin manifest to `0.3.20` and added `/chatdata:prepare-metric-answer`, fail-closed route planning before direct source reads, route-bound proof, reviewed answer feedback, and the shared Trust Harness scorecard tools
- fixed the Claude status line so remote MCP-only Claude setups are not shown as `mcp:missing` just because `~/.chatdata/config.json` is absent; the footer now detects the configured Claude `chatdata` MCP server and can refresh from `chatdata_doctor`
- corrected `/chatdata:help` repair copy so Claude Code users get the full remote MCP plus plugin setup path instead of the terminal-config-only fallback
- made the Claude status line self-refresh live workspace status, onboarding counts, Product ROI, trial days, and MCP doctor health instead of depending on a stale local context manifest or manual `/chatdata:status` state write
- bumped the plugin manifest to `0.3.19` and made the SessionStart hook quietly install ChatData as the user-level Claude status line while keeping `/chatdata:status` able to resolve the plugin version from `installed_plugins.json`
- bumped the plugin manifest to `0.3.18` and hardened Claude setup so the status-line installer fails closed, discovers the post-update plugin path, warns on project-local footer overrides, quotes cached marketplace hook paths, distinguishes configured from write-ready MCP in the footer, and ships the default plugin agent setting from source
- bumped the plugin manifest to `0.3.17` and made `/chatdata:status` plus `/chatdata:update` install ChatData as the default Claude Code status line while backing up any previous footer
- bumped the plugin manifest to `0.3.16` and made the Claude Code install contract explicit: Claude customers install both ChatData MCP and the plugin, while Cursor and Codex remain MCP-only
- bumped the plugin manifest to `0.3.15` and added Claude Code session hooks that remind active sessions to use read-write MCP, route metric-style prompts through ChatData before source tools, write reusable session/query context back through MCP, and run steward/review checks after writes
- bumped the plugin manifest to `0.3.14` to move the exploratory frame contract into the default active ChatData harness and validation commands, not only `/chatdata:warehouse-query`
- bumped the plugin manifest to `0.3.13` for the exploratory sensemaking contract across question framing, investigation, warehouse-query routing, proof receipts, and MCP answer-path writes
- bumped the plugin manifest to `0.3.12` after post-deploy QA found template query references and Codex package sync gaps in the `0.3.11` payload
- added `/chatdata:warehouse-query` plus the built-in `warehouse-query` skill so every install uses metric packets, answer paths, source references, validation, and provenance before raw SQL fallback
- added customer-owned `skills/customer-analytics-skill.md` and `sources/domain-reference-template.md` to the trust-layer repo template
- bumped the plugin manifest to `0.3.11` so Claude Code can detect the warehouse-query routing update
- restored `/chatdata:start`, `/chatdata:login`, and a broader picker-visible command catalog for customer onboarding
- added a `/chatdata:catalog` guide for using the AI-native data catalog, review queue, metrics, evidence, and sync workflows
- added customer-friendly command aliases for metrics, investigation, validation, benchmarks, evals, proof receipts, settings, trial/privacy, source connection, and context bootstrap
- added picker descriptions to every core command so typing `/chatdata` shows a useful feature map
- bumped the plugin manifest to `0.3.10` so Claude Code can detect the expanded command catalog
- cleaned stale company-repo skill wording so MCP-backed shared workspace context is the managed default
- updated the Claude Code status line to prefer MCP activation and local Context Hub cache state over the retired company-repo setup path
- fixed healthy MCP installs showing `repo:missing` and `setup:1/5` when no project-local `.chatdata/company-repo.json` exists
- bumped the plugin manifest to `0.3.9` so Claude Code can detect the marketplace update from the existing `0.3.7` distribution cache
- moved public plugin and MCP install instructions to the `getchatdatacom/chatdata-claude-marketplace` distribution repo
- replaced the public marketplace MIT license with the ChatData proprietary install/use license
- marked the MCP package metadata as `UNLICENSED`
- added `/chatdata:update` as the Wozcode-style update command for refreshing both the Claude plugin and MCP package
- added `/chatdata:onboarding` as a shared MCP-first onboarding flow that uses existing workspace context directionally and writes reusable setup artifacts back for every plugin and Slack user
- added `bin/onboarding_packet.py` to turn a local trust-layer repo into reviewable shared onboarding patches
- added `/chatdata:help` as the compact command router for setup status, command choice, and support routing
- added `/chatdata:but-for-real` and a matching skeptical verification agent for second-pass proof before declaring trust-layer work ready
- wired the second-pass standard into metric investigation, benchmark building, review-readiness, and Slack bundle publish flows
- declared the plugin Python helper dependency for Slack bundle publishing

## 0.1.0 - 2026-04-14

- packaged ChatData for Claude Code as one plugin with principal analyst mode and builder mode
- added principal workflows for metric investigation, WBR prep, and operating brief generation
- kept trust-layer bootstrap, benchmark, eval, drift, and Slack bundle publish flows in the same package
