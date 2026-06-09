# Changelog

## Unreleased

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
