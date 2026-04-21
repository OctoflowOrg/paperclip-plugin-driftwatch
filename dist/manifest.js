// src/manifest.ts
var manifest = {
  id: "paperclip-plugin-driftwatch",
  apiVersion: 1,
  version: "0.1.8",
  displayName: "DriftWatch",
  description: "Audit agent instructions in read-only mode. Detect drift, overlap, and handoff mismatches across your agent system.",
  author: "DriftWatch",
  categories: ["ui"],
  capabilities: [
    "agents.read",
    "http.outbound",
    "secrets.read-ref",
    "ui.page.register"
  ],
  entrypoints: {
    worker: "dist/worker.js",
    ui: "dist/ui"
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      provider: {
        type: "string",
        title: "Provider",
        description: "Which LLM provider to use for drift analysis",
        enum: ["anthropic", "openai"],
        default: "openai"
      },
      model: {
        type: "string",
        title: "Model",
        description: "Model ID (e.g. gpt-5, gpt-5-mini, claude-sonnet-4-5-20250514)",
        default: "gpt-5"
      },
      anthropicApiKey: {
        type: "string",
        format: "secret-ref",
        title: "Anthropic API key (override)",
        description: "Optional. Stored as a Paperclip encrypted secret reference. Falls back to ANTHROPIC_API_KEY env var if not set."
      },
      openaiApiKey: {
        type: "string",
        format: "secret-ref",
        title: "OpenAI API key (override)",
        description: "Optional. Stored as a Paperclip encrypted secret reference. Falls back to OPENAI_API_KEY env var if not set."
      }
    },
    required: ["provider", "model"]
  },
  ui: {
    slots: [
      {
        type: "page",
        id: "driftwatch-main",
        displayName: "DriftWatch",
        exportName: "DriftWatchPage",
        routePath: "driftwatch"
      }
    ]
  }
};
var manifest_default = manifest;
export {
  manifest_default as default
};
