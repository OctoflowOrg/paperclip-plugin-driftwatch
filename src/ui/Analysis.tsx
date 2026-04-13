import { getReact } from './bridge.js';
import type { AuditResult, Finding, FindingSeverity } from './types.js';

interface AnalysisProps {
  result: AuditResult | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
  agentCount: number;
}

export function Analysis({
  result,
  loading,
  error,
  onRun,
  agentCount,
}: AnalysisProps) {
  const React = getReact();
  const { createElement: h } = React;

  return h('div', { style: styles.container },
    h('div', { style: styles.header },
      h('span', null, 'Analysis'),
      h('button', {
        style: {
          ...styles.runBtn,
          opacity: loading || agentCount < 2 ? 0.5 : 1,
        },
        disabled: loading || agentCount < 2,
        onClick: onRun,
      }, loading ? 'Analyzing...' : 'Run'),
    ),
    h(
      'div',
      { style: styles.scope },
      agentCount < 2
        ? 'Select at least two agents to compare drift, overlap, and handoff behavior.'
        : `Audit will run across ${agentCount} selected agent${agentCount === 1 ? '' : 's'}.`,
    ),

    error
      ? h('div', { style: styles.error }, error)
      : null,

    !result && !loading && !error
      ? h('div', { style: styles.empty },
          'Run analysis to detect drift across the selected agents.',
        )
      : null,

    result ? renderResult(React, result) : null,
  );
}

function renderResult(React: any, result: AuditResult) {
  const { createElement: h } = React;

  const criticals = result.findings.filter((f) => f.severity === 'critical');
  const warnings = result.findings.filter((f) => f.severity === 'warning');
  const suggestions = result.findings.filter((f) => f.severity === 'suggestion');

  return h('div', { style: styles.results },
    h('div', { style: styles.intent },
      h('strong', null, 'Intent: '),
      result.inferredIntent,
    ),
    h('div', { style: styles.pipeline },
      h('strong', null, 'Pipeline: '),
      result.pipelineOrder.join(' \u2192 '),
    ),
    h('div', { style: styles.summary },
      criticals.length > 0
        ? h('span', { style: styles.countCritical }, `${criticals.length} critical`)
        : null,
      warnings.length > 0
        ? h('span', { style: styles.countWarning }, `${warnings.length} warning`)
        : null,
      suggestions.length > 0
        ? h('span', { style: styles.countSuggestion }, `${suggestions.length} suggestion`)
        : null,
    ),

    result.findings.length === 0
      ? h('div', { style: styles.clean }, 'No findings. Pipeline looks healthy.')
      : null,

    ...criticals.map((f, i) => renderFinding(React, f, `c${i}`)),
    ...warnings.map((f, i) => renderFinding(React, f, `w${i}`)),
    ...suggestions.map((f, i) => renderFinding(React, f, `s${i}`)),
  );
}

function renderFinding(React: any, finding: Finding, key: string) {
  const { createElement: h } = React;
  const colorMap: Record<FindingSeverity, string> = {
    critical: '#d32f2f',
    warning: '#f9a825',
    suggestion: '#1976d2',
  };
  const bgMap: Record<FindingSeverity, string> = {
    critical: '#fdecea',
    warning: '#fff8e1',
    suggestion: '#e3f2fd',
  };

  return h('div', {
    key,
    style: {
      ...styles.finding,
      borderLeft: `3px solid ${colorMap[finding.severity]}`,
      background: bgMap[finding.severity],
    },
  },
    h('div', { style: styles.findingHeader },
      h('span', {
        style: { ...styles.severityBadge, background: colorMap[finding.severity] },
      }, finding.severity),
      h('span', { style: styles.findingType }, finding.type),
    ),
    h('div', { style: styles.findingTitle }, finding.title),
    h('div', { style: styles.findingAgents },
      finding.agentsInvolved.map((a) =>
        h('span', { key: a, style: styles.agentPill }, a),
      ),
    ),
    h('div', { style: styles.findingDetail }, finding.detail),
    h('div', { style: styles.findingRec },
      h('strong', null, 'Fix: '),
      finding.recommendation,
    ),
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid var(--border-color, #e0e0e0)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    fontWeight: 600,
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: 'var(--text-secondary, #666)',
    borderBottom: '1px solid var(--border-color, #e0e0e0)',
  },
  runBtn: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid var(--accent-color, #1a73e8)',
    borderRadius: '4px',
    background: 'var(--accent-color, #1a73e8)',
    color: '#fff',
    cursor: 'pointer',
    textTransform: 'none' as const,
  },
  results: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px',
  },
  scope: {
    padding: '10px 12px',
    fontSize: '12px',
    lineHeight: '1.4',
    color: 'var(--text-secondary, #666)',
    borderBottom: '1px solid var(--border-color-light, #f0f0f0)',
    background: 'var(--surface-subtle, #fafafa)',
  },
  intent: {
    fontSize: '12px',
    marginBottom: '6px',
    color: 'var(--text-primary, #333)',
  },
  pipeline: {
    fontSize: '12px',
    marginBottom: '12px',
    color: 'var(--text-secondary, #666)',
  },
  summary: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  countCritical: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: '#d32f2f',
    color: '#fff',
  },
  countWarning: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: '#f9a825',
    color: '#333',
  },
  countSuggestion: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: '#1976d2',
    color: '#fff',
  },
  clean: {
    padding: '16px',
    textAlign: 'center' as const,
    color: 'var(--success-text, #2e7d32)',
    fontSize: '13px',
  },
  finding: {
    padding: '10px',
    marginBottom: '8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  findingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  severityBadge: {
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  findingType: {
    fontSize: '11px',
    color: 'var(--text-secondary, #666)',
    fontFamily: 'monospace',
  },
  findingTitle: {
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '6px',
  },
  findingAgents: {
    display: 'flex',
    gap: '4px',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
  },
  agentPill: {
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '8px',
    background: 'rgba(0,0,0,0.08)',
    fontFamily: 'monospace',
  },
  findingDetail: {
    marginBottom: '6px',
    lineHeight: '1.4',
  },
  findingRec: {
    color: 'var(--text-secondary, #555)',
    lineHeight: '1.4',
  },
  error: {
    margin: '12px',
    padding: '10px',
    background: '#fdecea',
    color: '#d32f2f',
    borderRadius: '4px',
    fontSize: '12px',
  },
  empty: {
    padding: '24px 16px',
    color: 'var(--text-secondary, #999)',
    fontSize: '13px',
    textAlign: 'center' as const,
  },
};
