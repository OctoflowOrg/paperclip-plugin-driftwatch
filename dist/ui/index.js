// src/ui/bridge.ts
function getReact() {
  return globalThis.__paperclipPluginBridge__?.react;
}
function getHook(name) {
  return globalThis.__paperclipPluginBridge__?.sdkUi?.[name];
}

// src/ui/AgentList.tsx
function AgentList({
  agents,
  selectedId,
  onSelect,
  loading,
  includedIds,
  onToggleIncluded
}) {
  const React = getReact();
  const { createElement: h } = React;
  if (loading) {
    return h(
      "div",
      { style: styles.container },
      h("div", { style: styles.header }, "Agents"),
      h("div", { style: styles.loading }, "Loading agents...")
    );
  }
  return h(
    "div",
    { style: styles.container },
    h("div", { style: styles.header }, "Agents"),
    h(
      "div",
      { style: styles.notice },
      "Select which agents to include in drift analysis. Click a row to inspect its instruction bundle."
    ),
    h(
      "div",
      { style: styles.list },
      agents.map(
        (agent) => h(
          "div",
          {
            key: agent.id,
            style: {
              ...styles.item,
              ...selectedId === agent.id ? styles.itemSelected : {}
            },
            onClick: (event) => {
              const target = event.target;
              if (target?.closest('input[type="checkbox"]')) {
                return;
              }
              onSelect(agent);
            }
          },
          h(
            "div",
            { style: styles.itemHeader },
            h("input", {
              type: "checkbox",
              checked: includedIds.includes(agent.id),
              onChange: () => onToggleIncluded(agent.id),
              onClick: (event) => event.stopPropagation()
            }),
            h(
              "div",
              { style: styles.meta },
              h("div", { style: styles.name }, agent.name || agent.title || agent.id),
              h("div", { style: styles.role }, agent.role || "")
            )
          )
        )
      )
    )
  );
}
var styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid var(--border-color, #e0e0e0)",
    overflow: "hidden"
  },
  header: {
    padding: "12px 16px",
    fontWeight: 600,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-secondary, #666)",
    borderBottom: "1px solid var(--border-color, #e0e0e0)"
  },
  list: {
    flex: 1,
    overflowY: "auto"
  },
  notice: {
    padding: "10px 16px",
    fontSize: "12px",
    lineHeight: "1.4",
    color: "var(--text-secondary, #666)",
    background: "var(--surface-subtle, #fafafa)",
    borderBottom: "1px solid var(--border-color-light, #f0f0f0)"
  },
  item: {
    padding: "10px 16px",
    cursor: "pointer",
    borderBottom: "1px solid var(--border-color-light, #f0f0f0)",
    transition: "background 0.15s"
  },
  itemHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px"
  },
  itemSelected: {
    background: "var(--selection-bg, #e8f0fe)",
    borderLeft: "3px solid var(--accent-color, #1a73e8)",
    paddingLeft: "13px"
  },
  meta: {
    minWidth: 0
  },
  name: {
    fontSize: "14px",
    fontWeight: 500
  },
  role: {
    fontSize: "12px",
    color: "var(--text-secondary, #888)",
    marginTop: "2px"
  },
  loading: {
    padding: "16px",
    color: "var(--text-secondary, #888)",
    fontSize: "13px"
  }
};

// src/ui/Editor.tsx
function Editor({
  file,
  loading,
  agentName,
  readOnlyLabel
}) {
  const React = getReact();
  const { createElement: h } = React;
  if (!file && !loading) {
    return h(
      "div",
      { style: styles2.empty },
      h("div", { style: styles2.emptyText }, "Select an agent to edit instructions")
    );
  }
  if (loading) {
    return h(
      "div",
      { style: styles2.empty },
      h("div", { style: styles2.emptyText }, "Loading...")
    );
  }
  return h(
    "div",
    { style: styles2.container },
    h(
      "div",
      { style: styles2.toolbar },
      h(
        "span",
        { style: styles2.fileName },
        agentName,
        file ? ` / ${file.path}` : ""
      ),
      h("span", { style: styles2.readOnlyBadge }, readOnlyLabel)
    ),
    h("textarea", {
      style: styles2.textarea,
      value: file?.content ?? "",
      readOnly: true,
      spellCheck: false
    })
  );
}
var styles2 = {
  container: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    borderBottom: "1px solid var(--border-color, #e0e0e0)",
    background: "var(--surface-bg, #fafafa)"
  },
  fileName: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-primary, #333)"
  },
  readOnlyBadge: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "10px",
    background: "var(--warning-bg, #fff3cd)",
    color: "var(--warning-text, #856404)",
    fontWeight: 600
  },
  textarea: {
    flex: 1,
    padding: "16px",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    fontSize: "12px",
    lineHeight: "1.6",
    border: "none",
    outline: "none",
    resize: "none",
    background: "var(--editor-bg, #fff)",
    color: "var(--text-primary, #1a1a1a)",
    cursor: "default"
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "var(--text-secondary, #999)"
  },
  emptyText: {
    fontSize: "14px"
  }
};

// src/ui/Analysis.tsx
function Analysis({
  result,
  loading,
  error,
  onRun,
  agentCount
}) {
  const React = getReact();
  const { createElement: h } = React;
  return h(
    "div",
    { style: styles3.container },
    h(
      "div",
      { style: styles3.header },
      h("span", null, "Analysis"),
      h("button", {
        style: {
          ...styles3.runBtn,
          opacity: loading || agentCount < 2 ? 0.5 : 1
        },
        disabled: loading || agentCount < 2,
        onClick: onRun
      }, loading ? "Analyzing..." : "Run")
    ),
    h(
      "div",
      { style: styles3.scope },
      agentCount < 2 ? "Select at least two agents to compare drift, overlap, and handoff behavior." : `Audit will run across ${agentCount} selected agent${agentCount === 1 ? "" : "s"}.`
    ),
    error ? h("div", { style: styles3.error }, error) : null,
    !result && !loading && !error ? h(
      "div",
      { style: styles3.empty },
      "Run analysis to detect drift across the selected agents."
    ) : null,
    result ? renderResult(React, result) : null
  );
}
function renderResult(React, result) {
  const { createElement: h } = React;
  const criticals = result.findings.filter((f) => f.severity === "critical");
  const warnings = result.findings.filter((f) => f.severity === "warning");
  const suggestions = result.findings.filter((f) => f.severity === "suggestion");
  return h(
    "div",
    { style: styles3.results },
    h(
      "div",
      { style: styles3.intent },
      h("strong", null, "Intent: "),
      result.inferredIntent
    ),
    h(
      "div",
      { style: styles3.pipeline },
      h("strong", null, "Pipeline: "),
      result.pipelineOrder.join(" \u2192 ")
    ),
    h(
      "div",
      { style: styles3.summary },
      criticals.length > 0 ? h("span", { style: styles3.countCritical }, `${criticals.length} critical`) : null,
      warnings.length > 0 ? h("span", { style: styles3.countWarning }, `${warnings.length} warning`) : null,
      suggestions.length > 0 ? h("span", { style: styles3.countSuggestion }, `${suggestions.length} suggestion`) : null
    ),
    result.findings.length === 0 ? h("div", { style: styles3.clean }, "No findings. Pipeline looks healthy.") : null,
    ...criticals.map((f, i) => renderFinding(React, f, `c${i}`)),
    ...warnings.map((f, i) => renderFinding(React, f, `w${i}`)),
    ...suggestions.map((f, i) => renderFinding(React, f, `s${i}`))
  );
}
function renderFinding(React, finding, key) {
  const { createElement: h } = React;
  const colorMap = {
    critical: "#d32f2f",
    warning: "#f9a825",
    suggestion: "#1976d2"
  };
  const bgMap = {
    critical: "#fdecea",
    warning: "#fff8e1",
    suggestion: "#e3f2fd"
  };
  return h(
    "div",
    {
      key,
      style: {
        ...styles3.finding,
        borderLeft: `3px solid ${colorMap[finding.severity]}`,
        background: bgMap[finding.severity]
      }
    },
    h(
      "div",
      { style: styles3.findingHeader },
      h("span", {
        style: { ...styles3.severityBadge, background: colorMap[finding.severity] }
      }, finding.severity),
      h("span", { style: styles3.findingType }, finding.type)
    ),
    h("div", { style: styles3.findingTitle }, finding.title),
    h(
      "div",
      { style: styles3.findingAgents },
      finding.agentsInvolved.map(
        (a) => h("span", { key: a, style: styles3.agentPill }, a)
      )
    ),
    h("div", { style: styles3.findingDetail }, finding.detail),
    h(
      "div",
      { style: styles3.findingRec },
      h("strong", null, "Fix: "),
      finding.recommendation
    )
  );
}
var styles3 = {
  container: {
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid var(--border-color, #e0e0e0)",
    overflow: "hidden"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    fontWeight: 600,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-secondary, #666)",
    borderBottom: "1px solid var(--border-color, #e0e0e0)"
  },
  runBtn: {
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 500,
    border: "1px solid var(--accent-color, #1a73e8)",
    borderRadius: "4px",
    background: "var(--accent-color, #1a73e8)",
    color: "#fff",
    cursor: "pointer",
    textTransform: "none"
  },
  results: {
    flex: 1,
    overflowY: "auto",
    padding: "12px"
  },
  scope: {
    padding: "10px 12px",
    fontSize: "12px",
    lineHeight: "1.4",
    color: "var(--text-secondary, #666)",
    borderBottom: "1px solid var(--border-color-light, #f0f0f0)",
    background: "var(--surface-subtle, #fafafa)"
  },
  intent: {
    fontSize: "12px",
    marginBottom: "6px",
    color: "var(--text-primary, #333)"
  },
  pipeline: {
    fontSize: "12px",
    marginBottom: "12px",
    color: "var(--text-secondary, #666)"
  },
  summary: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px"
  },
  countCritical: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "10px",
    background: "#d32f2f",
    color: "#fff"
  },
  countWarning: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "10px",
    background: "#f9a825",
    color: "#333"
  },
  countSuggestion: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "10px",
    background: "#1976d2",
    color: "#fff"
  },
  clean: {
    padding: "16px",
    textAlign: "center",
    color: "var(--success-text, #2e7d32)",
    fontSize: "13px"
  },
  finding: {
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "4px",
    fontSize: "12px"
  },
  findingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px"
  },
  severityBadge: {
    fontSize: "10px",
    padding: "1px 6px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: 600,
    textTransform: "uppercase"
  },
  findingType: {
    fontSize: "11px",
    color: "var(--text-secondary, #666)",
    fontFamily: "monospace"
  },
  findingTitle: {
    fontWeight: 600,
    fontSize: "13px",
    marginBottom: "6px"
  },
  findingAgents: {
    display: "flex",
    gap: "4px",
    marginBottom: "6px",
    flexWrap: "wrap"
  },
  agentPill: {
    fontSize: "10px",
    padding: "1px 6px",
    borderRadius: "8px",
    background: "rgba(0,0,0,0.08)",
    fontFamily: "monospace"
  },
  findingDetail: {
    marginBottom: "6px",
    lineHeight: "1.4"
  },
  findingRec: {
    color: "var(--text-secondary, #555)",
    lineHeight: "1.4"
  },
  error: {
    margin: "12px",
    padding: "10px",
    background: "#fdecea",
    color: "#d32f2f",
    borderRadius: "4px",
    fontSize: "12px"
  },
  empty: {
    padding: "24px 16px",
    color: "var(--text-secondary, #999)",
    fontSize: "13px",
    textAlign: "center"
  }
};

// src/ui/App.tsx
function App() {
  const React = getReact();
  const {
    createElement: h,
    useState,
    useEffect,
    useCallback
  } = React;
  const useHostContext = getHook("useHostContext");
  const usePluginData = getHook("usePluginData");
  const usePluginAction = getHook("usePluginAction");
  const usePluginToast = getHook("usePluginToast");
  const context = useHostContext();
  const companyId = context?.companyId;
  const {
    data: agents,
    loading: agentsLoading
  } = usePluginData("agents", { companyId });
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [includedAgentIds, setIncludedAgentIds] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const runAnalysis = usePluginAction("run-analysis");
  const toast = usePluginToast();
  const allAgents = agents ?? [];
  useEffect(() => {
    if (allAgents.length === 0) {
      setIncludedAgentIds(
        (previous) => previous.length === 0 ? previous : []
      );
      if (selectedAgent) {
        setSelectedAgent(null);
        setCurrentFile(null);
      }
      return;
    }
    setIncludedAgentIds((previous) => {
      const existingIds = new Set(allAgents.map((agent) => agent.id));
      const retained = previous.filter((id) => existingIds.has(id));
      if (retained.length > 0) {
        const isSame2 = retained.length === previous.length && retained.every((id, index) => id === previous[index]);
        return isSame2 ? previous : retained;
      }
      const next = allAgents.map((agent) => agent.id);
      const isSame = next.length === previous.length && next.every((id, index) => id === previous[index]);
      return isSame ? previous : next;
    });
    if (selectedAgent && !allAgents.some((agent) => agent.id === selectedAgent.id)) {
      setSelectedAgent(null);
      setCurrentFile(null);
    }
  }, [allAgents, selectedAgent]);
  const analysisAgents = allAgents.filter(
    (agent) => includedAgentIds.includes(agent.id)
  );
  const handleAgentSelect = useCallback(async (agent) => {
    setSelectedAgent(agent);
    setCurrentFile(null);
    setFilesLoading(true);
    try {
      const bundleRes = await fetch(`/api/agents/${agent.id}/instructions-bundle`);
      const bundle = await bundleRes.json();
      const fileList = Array.isArray(bundle) ? bundle : bundle.files ?? [];
      if (fileList.length > 0) {
        const first = fileList[0];
        const contentRes = await fetch(
          `/api/agents/${agent.id}/instructions-bundle/file?path=${encodeURIComponent(first.path)}`
        );
        const fileData = await contentRes.json();
        const loaded = {
          path: first.path,
          content: fileData.content ?? ""
        };
        setCurrentFile(loaded);
      }
    } catch (err) {
      toast({
        title: "Failed to load agent files",
        body: String(err),
        tone: "error",
        ttlMs: 5e3
      });
    } finally {
      setFilesLoading(false);
    }
  }, [toast]);
  const handleToggleIncluded = useCallback((agentId) => {
    setIncludedAgentIds(
      (previous) => previous.includes(agentId) ? previous.filter((id) => id !== agentId) : [...previous, agentId]
    );
  }, []);
  const handleRunAnalysis = useCallback(async () => {
    const agentList = analysisAgents;
    if (agentList.length < 2) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const agentPayloads = await Promise.all(
        agentList.map(async (agent) => {
          const bundleRes = await fetch(
            `/api/agents/${agent.id}/instructions-bundle`
          );
          const bundle = await bundleRes.json();
          const fileList = Array.isArray(bundle) ? bundle : bundle.files ?? [];
          const contents = await Promise.all(
            fileList.map(async (f) => {
              const res = await fetch(
                `/api/agents/${agent.id}/instructions-bundle/file?path=${encodeURIComponent(f.path)}`
              );
              const data = await res.json();
              return data.content ?? "";
            })
          );
          return {
            id: agent.name || agent.id,
            name: agent.name || agent.title || agent.id,
            content: contents.join("\n\n")
          };
        })
      );
      const result = await runAnalysis({ agents: agentPayloads });
      setAnalysisResult(result);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setAnalysisLoading(false);
    }
  }, [analysisAgents, runAnalysis]);
  return h(
    "div",
    { style: styles4.root },
    h(AgentList, {
      agents: allAgents,
      selectedId: selectedAgent?.id ?? null,
      onSelect: handleAgentSelect,
      loading: agentsLoading,
      includedIds: includedAgentIds,
      onToggleIncluded: handleToggleIncluded
    }),
    h(Editor, {
      file: currentFile,
      loading: filesLoading,
      agentName: selectedAgent?.name || selectedAgent?.title || "",
      readOnlyLabel: "Read-only audit mode"
    }),
    h(Analysis, {
      result: analysisResult,
      loading: analysisLoading,
      error: analysisError,
      onRun: handleRunAnalysis,
      agentCount: analysisAgents.length
    })
  );
}
var styles4 = {
  root: {
    display: "grid",
    gridTemplateColumns: "220px 1fr 300px",
    height: "100%",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "var(--text-primary, #1a1a1a)",
    background: "var(--surface-bg, #fff)"
  }
};

// src/ui/index.tsx
function DriftWatchPage(props) {
  return App();
}
export {
  DriftWatchPage
};
