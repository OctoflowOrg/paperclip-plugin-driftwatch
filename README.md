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
```

## Publish

```bash
pnpm publish --access public
```

## Install In Paperclip

Use the Plugins UI and install by npm package name:

```text
@octofloworg/paperclip-plugin-driftwatch
```

## Notes

This package includes a committed `dist/` bundle for Paperclip consumption. If you change `src/`, rebuild before publishing.
