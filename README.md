# DriftWatch

DriftWatch is a read-only Paperclip plugin for auditing agent instruction bundles.

It helps compare selected agents for:

- ownership conflicts
- handoff mismatches
- soft gates
- scope creep
- dead outputs
- contradictory rules

## Current Rollout

The current version is intentionally observational only:

- instruction bundles can be viewed
- operators choose which agents to compare
- analysis runs against the selected agents
- live instruction bundles are not written back by the plugin

Defaults:

- provider: `openai`
- model: `gpt-5`
- auth: `OPENAI_API_KEY` unless a plugin secret override is configured

## Build

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm verify:package
```

## Install In Paperclip

Use the Plugins UI and install by npm package name:

```text
@octofloworg/paperclip-plugin-driftwatch
```

## Publishing

This package is set up for GitHub Actions publishing.

Recommended release flow:

1. Push to GitHub.
2. In npm, configure trusted publishing for this repo and the publish workflow.
3. Trigger the `Publish Package` GitHub Action manually, or push a tag like `v0.1.0`.

The workflow will:

- install dependencies with pnpm
- rebuild `dist/`
- run `npm pack --dry-run`
- publish to npm with provenance using trusted publishing

## Notes

This package includes a committed `dist/` bundle for Paperclip consumption. If you change `src/`, rebuild before publishing.
