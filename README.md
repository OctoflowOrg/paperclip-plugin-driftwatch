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

## Deployment

Recommended shape for self-hosted Paperclip deployments:

1. Keep DriftWatch in its own repo.
2. Build the plugin so the repo contains a valid `dist/` bundle.
3. On the hosted server, clone or pull that repo to a persistent host path.
4. Make that plugin path available to the Paperclip instance.
5. Install the plugin from that local server path in the Paperclip Plugins UI.

This avoids coupling plugin deploys to the Paperclip image.

## Plugin Settings

In the plugin settings, keep:

- provider = `openai`
- model = `gpt-5`

Leave API key overrides empty unless you intentionally want plugin-specific
secrets instead of env-based auth.

If you do set `openaiApiKey` or `anthropicApiKey` in plugin settings, those
fields are registered as Paperclip `secret-ref` values and resolved through the
instance secrets provider. In a `local_encrypted` secrets store, they are
protected by the instance master key.

## Verify

After installation:

- the DriftWatch page appears in the UI
- plugin health reports `ok`
- the sidebar shows company agents with checkboxes for analysis scope
- the editor shows a read-only badge
- analysis runs without modifying any instruction bundle files

## Safety Notes

- DriftWatch v1 is observational only — live instruction files are not written back
- do not use it as the live prompt editor yet
- if the plugin is disabled or uninstalled, other running workflows are unaffected

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
