#!/usr/bin/env node

// src/worker.ts
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
var SYSTEM_PROMPT = `You are auditing a set of agent instruction files for a multi-agent pipeline.

A healthy multi-agent system has:
- Clear ownership: each capability belongs to exactly one agent
- Explicit handoffs: what each agent expects as input and produces as output must match across adjacent agents
- No implicit state: agents don't assume context that wasn't explicitly passed
- Enforced gates: approval/validation steps are structurally enforced, not just mentioned in instructions
- Minimal overlap: agents don't duplicate logic

Failure modes to detect:
- ownership_conflict: two agents claiming the same responsibility
- handoff_mismatch: agent expects input no upstream agent produces
- soft_gate: approval or validation step that is advisory only
- scope_creep: agent role so broad it risks absorbing another's responsibilities
- coverage_gap: a required step that no agent owns
- dead_output: an agent produces something no downstream agent consumes
- contradictory_rules: agents have conflicting instructions on the same topic

Return ONLY valid JSON, no prose, no markdown fences:
{
  "inferredIntent": "one sentence",
  "pipelineOrder": ["agent_id"],
  "agents": [
    {
      "id": "string",
      "roleSummary": "string",
      "expects": ["string"],
      "produces": ["string"],
      "keyRules": ["string"]
    }
  ],
  "findings": [
    {
      "severity": "critical | warning | suggestion",
      "type": "one of the 7 types above",
      "title": "max 8 words",
      "agentsInvolved": ["agent_id"],
      "detail": "specific explanation with brief quotes from instructions",
      "recommendation": "concrete fix"
    }
  ]
}

Severity: critical = will break flow, warning = might cause problems,
suggestion = improvement. Always flag soft_gate as critical.`;
var FINDING_TYPES = [
  "ownership_conflict",
  "handoff_mismatch",
  "soft_gate",
  "scope_creep",
  "coverage_gap",
  "dead_output",
  "contradictory_rules"
];
var SEVERITIES = ["critical", "warning", "suggestion"];
var AUDIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    inferredIntent: { type: "string" },
    pipelineOrder: {
      type: "array",
      items: { type: "string" }
    },
    agents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          roleSummary: { type: "string" },
          expects: {
            type: "array",
            items: { type: "string" }
          },
          produces: {
            type: "array",
            items: { type: "string" }
          },
          keyRules: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["id", "roleSummary", "expects", "produces", "keyRules"]
      }
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          severity: {
            type: "string",
            enum: [...SEVERITIES]
          },
          type: {
            type: "string",
            enum: [...FINDING_TYPES]
          },
          title: { type: "string" },
          agentsInvolved: {
            type: "array",
            items: { type: "string" }
          },
          detail: { type: "string" },
          recommendation: { type: "string" }
        },
        required: [
          "severity",
          "type",
          "title",
          "agentsInvolved",
          "detail",
          "recommendation"
        ]
      }
    }
  },
  required: ["inferredIntent", "pipelineOrder", "agents", "findings"]
};
function absoluteApiUrl(path) {
  const base = process.env.PAPERCLIP_PUBLIC_URL ?? process.env.PAPERCLIP_API_URL ?? "https://agents.octosync.dev";
  return new URL(path, base).toString();
}
function extractErrorMessage(data) {
  if (!data || typeof data !== "object") return null;
  const record = data;
  const error = record.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message2 = error.message;
    if (typeof message2 === "string") return message2;
  }
  const message = record.message;
  if (typeof message === "string") return message;
  return null;
}
async function readJsonResponse(res, provider) {
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const detail = extractErrorMessage(data) ?? (typeof data === "string" ? data : JSON.stringify(data ?? {}));
    throw new Error(`${provider} API error ${res.status}: ${detail}`);
  }
  return data;
}
function parseAuditJson(raw, provider) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `${provider} returned non-JSON audit output: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
function extractOpenAIOutputText(data) {
  if (!data || typeof data !== "object") {
    throw new Error("No structured response from OpenAI");
  }
  const record = data;
  const direct = record.output_text;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }
  const output = record.output;
  if (!Array.isArray(output)) {
    throw new Error("OpenAI response did not include output content");
  }
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = item.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const blockRecord = block;
      if (blockRecord.type === "output_text" && typeof blockRecord.text === "string" && blockRecord.text.trim()) {
        return blockRecord.text.trim();
      }
      if (blockRecord.type === "refusal" && typeof blockRecord.refusal === "string") {
        throw new Error(`OpenAI refused audit output: ${blockRecord.refusal}`);
      }
    }
  }
  throw new Error("No text response from OpenAI");
}
async function callAnthropic(config, userContent) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }]
    })
  });
  const data = await readJsonResponse(res, "Anthropic");
  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response from Anthropic");
  return parseAuditJson(textBlock.text, "anthropic");
}
async function callOpenAI(config, userContent) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      max_output_tokens: 8192,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: SYSTEM_PROMPT }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userContent }]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "driftwatch_audit",
          strict: true,
          schema: AUDIT_SCHEMA
        }
      }
    })
  });
  const data = await readJsonResponse(res, "OpenAI");
  const rawText = extractOpenAIOutputText(data);
  return parseAuditJson(rawText, "openai");
}
async function callModel(config, userContent) {
  switch (config.provider) {
    case "anthropic":
      return callAnthropic(config, userContent);
    case "openai":
      return callOpenAI(config, userContent);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
var plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("DriftWatch plugin starting");
    ctx.data.register("agents", async (params) => {
      const companyId = params.companyId;
      const res = await ctx.http.fetch(
        absoluteApiUrl(`/api/companies/${companyId}/agents`),
        { method: "GET" }
      );
      return res.json();
    });
    ctx.data.register("instruction-files", async (params) => {
      const agentId = params.agentId;
      const res = await ctx.http.fetch(
        absoluteApiUrl(`/api/agents/${agentId}/instructions-bundle`),
        { method: "GET" }
      );
      return res.json();
    });
    ctx.data.register("file-content", async (params) => {
      const agentId = params.agentId;
      const path = params.path;
      const res = await ctx.http.fetch(
        absoluteApiUrl(
          `/api/agents/${agentId}/instructions-bundle/file?path=${encodeURIComponent(path)}`
        ),
        { method: "GET" }
      );
      return res.json();
    });
    ctx.actions.register("run-analysis", async (params) => {
      const agents = params.agents;
      const pluginConfig = await ctx.config.get();
      const provider = pluginConfig.provider ?? "openai";
      const model = pluginConfig.model ?? "gpt-5";
      const keyRef = provider === "openai" ? pluginConfig.openaiApiKey : pluginConfig.anthropicApiKey;
      let apiKey;
      if (keyRef && typeof keyRef === "string") {
        apiKey = keyRef;
      }
      if (!apiKey) {
        const envVar = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
        apiKey = process.env[envVar];
      }
      if (!apiKey) {
        const envVar = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
        throw new Error(
          `No API key for "${provider}". Set ${envVar} env var or configure in plugin settings.`
        );
      }
      const userContent = agents.map((a) => `--- ${a.id} ---
${a.content}`).join("\n\n");
      ctx.logger.info("Running analysis", { provider, model, agentCount: agents.length });
      return await callModel({ provider, model, apiKey }, userContent);
    });
  },
  async onHealth() {
    return { status: "ok", message: "DriftWatch active" };
  }
});
var worker_default = plugin;
runWorker(plugin, import.meta.url);
export {
  worker_default as default
};
