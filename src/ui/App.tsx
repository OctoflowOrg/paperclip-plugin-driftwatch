import { getReact, getHook } from './bridge.js';
import { AgentList } from './AgentList.js';
import { Editor } from './Editor.js';
import { Analysis } from './Analysis.js';
import type { Agent, InstructionFile, AuditResult } from './types.js';

function describeError(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const nested = record.error;
    if (typeof nested === 'string') return nested;
    if (nested && typeof nested === 'object') {
      const nestedMessage = (nested as Record<string, unknown>).message;
      if (typeof nestedMessage === 'string') return nestedMessage;
    }
    const message = record.message;
    if (typeof message === 'string') return message;
    try {
      return JSON.stringify(error, null, 2);
    } catch {}
  }
  return String(error);
}

export function App() {
  const React = getReact();
  const {
    createElement: h,
    useState,
    useEffect,
    useCallback,
  } = React;

  const useHostContext = getHook('useHostContext');
  const usePluginAction = getHook('usePluginAction');
  const usePluginToast = getHook('usePluginToast');

  const context = useHostContext();
  const companyId = context?.companyId;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  // Selection state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [includedAgentIds, setIncludedAgentIds] = useState<string[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<InstructionFile | null>(null);

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<AuditResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Actions
  const runAnalysis = usePluginAction('run-analysis');
  const toast = usePluginToast();

  const allAgents: Agent[] = agents;
  const resolvedAgentsError = agentsError;

  useEffect(() => {
    if (!companyId) {
      setAgents([]);
      setAgentsError('Missing company context');
      setAgentsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAgents() {
      setAgentsLoading(true);
      setAgentsError(null);

      try {
        const res = await fetch(`/api/companies/${companyId}/agents`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.error || data?.message || `Failed to load agents: HTTP ${res.status}`,
          );
        }

        if (!cancelled) {
          setAgents(
            Array.isArray(data) ? data : Array.isArray(data?.agents) ? data.agents : [],
          );
        }
      } catch (error) {
        if (!cancelled) {
          setAgents([]);
          setAgentsError(describeError(error));
        }
      } finally {
        if (!cancelled) {
          setAgentsLoading(false);
        }
      }
    }

    loadAgents();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (allAgents.length === 0) {
      setIncludedAgentIds((previous) =>
        previous.length === 0 ? previous : [],
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
        const isSame =
          retained.length === previous.length &&
          retained.every((id, index) => id === previous[index]);
        return isSame ? previous : retained;
      }
      const next = allAgents.map((agent) => agent.id);
      const isSame =
        next.length === previous.length &&
        next.every((id, index) => id === previous[index]);
      return isSame ? previous : next;
    });

    if (
      selectedAgent &&
      !allAgents.some((agent) => agent.id === selectedAgent.id)
    ) {
      setSelectedAgent(null);
      setCurrentFile(null);
    }
  }, [allAgents, selectedAgent]);

  const analysisAgents = allAgents.filter((agent) =>
    includedAgentIds.includes(agent.id),
  );

  // Load instruction files when agent is selected
  const handleAgentSelect = useCallback(async (agent: Agent) => {
    setSelectedAgent(agent);
    setCurrentFile(null);
    setFilesLoading(true);

    try {
      const bundleRes = await fetch(`/api/agents/${agent.id}/instructions-bundle`);
      const bundle = await bundleRes.json();
      const fileList: InstructionFile[] = Array.isArray(bundle)
        ? bundle
        : bundle.files ?? [];

      // Auto-select first file
      if (fileList.length > 0) {
        const first = fileList[0];
        const contentRes = await fetch(
          `/api/agents/${agent.id}/instructions-bundle/file?path=${encodeURIComponent(first.path)}`,
        );
        const fileData = await contentRes.json();
        const loaded: InstructionFile = {
          path: first.path,
          content: fileData.content ?? '',
        };
        setCurrentFile(loaded);
      }
    } catch (err) {
      toast({
        title: 'Failed to load agent files',
        body: describeError(err),
        tone: 'error',
        ttlMs: 5000,
      });
    } finally {
      setFilesLoading(false);
    }
  }, [toast]);

  const handleToggleIncluded = useCallback((agentId: string) => {
    setIncludedAgentIds((previous) =>
      previous.includes(agentId)
        ? previous.filter((id) => id !== agentId)
        : [...previous, agentId],
    );
  }, []);

  // Run drift analysis
  const handleRunAnalysis = useCallback(async () => {
    const agentList: Agent[] = analysisAgents;
    if (agentList.length < 2) return;

    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      // Collect all agent instruction contents
      const agentPayloads = await Promise.all(
        agentList.map(async (agent: Agent) => {
          const bundleRes = await fetch(
            `/api/agents/${agent.id}/instructions-bundle`,
          );
          const bundle = await bundleRes.json();
          const fileList: InstructionFile[] = Array.isArray(bundle)
            ? bundle
            : bundle.files ?? [];

          // Concatenate all files for the agent
          const contents = await Promise.all(
            fileList.map(async (f: InstructionFile) => {
              const res = await fetch(
                `/api/agents/${agent.id}/instructions-bundle/file?path=${encodeURIComponent(f.path)}`,
              );
              const data = await res.json();
              return data.content ?? '';
            }),
          );

          return {
            id: agent.name || agent.id,
            name: agent.name || agent.title || agent.id,
            content: contents.join('\n\n'),
          };
        }),
      );

      const result = await runAnalysis({ agents: agentPayloads });
      setAnalysisResult(result as AuditResult);
    } catch (err) {
      setAnalysisError(describeError(err));
    } finally {
      setAnalysisLoading(false);
    }
  }, [analysisAgents, runAnalysis]);

  return h('div', { style: styles.root },
    h(AgentList, {
      agents: allAgents,
      selectedId: selectedAgent?.id ?? null,
      onSelect: handleAgentSelect,
      loading: agentsLoading,
      includedIds: includedAgentIds,
      onToggleIncluded: handleToggleIncluded,
      error: resolvedAgentsError,
    }),
    h(Editor, {
      file: currentFile,
      loading: filesLoading,
      agentName: selectedAgent?.name || selectedAgent?.title || '',
      readOnlyLabel: 'Read-only audit mode',
    }),
    h(Analysis, {
      result: analysisResult,
      loading: analysisLoading,
      error: analysisError,
      onRun: handleRunAnalysis,
      agentCount: analysisAgents.length,
    }),
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr 300px',
    height: '100%',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: 'var(--text-primary, #e5e7eb)',
    background: 'var(--surface-bg, transparent)',
  },
  panel: {
    background: 'var(--panel-bg, rgba(255,255,255,0.02))',
    backdropFilter: 'blur(8px)',
  },
};
