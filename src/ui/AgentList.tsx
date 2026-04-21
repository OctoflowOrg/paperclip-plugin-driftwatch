import { getReact } from './bridge.js';
import type { Agent } from './types.js';

interface AgentListProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (agent: Agent) => void;
  loading: boolean;
  includedIds: string[];
  onToggleIncluded: (agentId: string) => void;
  error?: string | null;
}

export function AgentList({
  agents,
  selectedId,
  onSelect,
  loading,
  includedIds,
  onToggleIncluded,
  error,
}: AgentListProps) {
  const React = getReact();
  const { createElement: h } = React;

  if (loading) {
    return h('div', { style: styles.container },
      h('div', { style: styles.header }, 'Agents'),
      h('div', { style: styles.loading }, 'Loading agents...'),
    );
  }

  return h('div', { style: styles.container },
    h('div', { style: styles.header }, 'Agents'),
    h(
      'div',
      { style: styles.notice },
      'Select which agents to include in drift analysis. Click a row to inspect its instruction bundle.',
    ),
    error
      ? h('div', { style: styles.error }, error)
      : null,
    h('div', { style: styles.list },
      agents.map((agent) =>
        h('div', {
          key: agent.id,
          style: {
            ...styles.item,
            ...(selectedId === agent.id ? styles.itemSelected : {}),
          },
          onClick: (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('input[type="checkbox"]')) {
              return;
            }
            onSelect(agent);
          },
        },
          h('div', { style: styles.itemHeader },
            h('input', {
              type: 'checkbox',
              checked: includedIds.includes(agent.id),
              onChange: () => onToggleIncluded(agent.id),
              onClick: (event: MouseEvent) => event.stopPropagation(),
            }),
            h('div', { style: styles.meta },
              h('div', { style: styles.name }, agent.name || agent.title || agent.id),
              h('div', { style: styles.role }, agent.role || ''),
            ),
          ),
        ),
      ),
    ),
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--border-color, rgba(255,255,255,0.08))',
    background: 'var(--panel-bg, rgba(255,255,255,0.02))',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    fontWeight: 600,
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: 'var(--text-secondary, #9ca3af)',
    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  notice: {
    padding: '10px 16px',
    fontSize: '12px',
    lineHeight: '1.4',
    color: 'var(--text-secondary, #9ca3af)',
    background: 'var(--surface-subtle, rgba(255,255,255,0.03))',
    borderBottom: '1px solid var(--border-color-light, rgba(255,255,255,0.06))',
  },
  item: {
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border-color-light, rgba(255,255,255,0.06))',
    transition: 'background 0.15s',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  itemSelected: {
    background: 'var(--selection-bg, rgba(96,165,250,0.14))',
    borderLeft: '3px solid var(--accent-color, #60a5fa)',
    paddingLeft: '13px',
  },
  meta: {
    minWidth: 0,
  },
  name: {
    fontSize: '14px',
    fontWeight: 500,
  },
  role: {
    fontSize: '12px',
    color: 'var(--text-secondary, #94a3b8)',
    marginTop: '2px',
  },
  loading: {
    padding: '16px',
    color: 'var(--text-secondary, #94a3b8)',
    fontSize: '13px',
  },
  error: {
    padding: '10px 16px',
    fontSize: '12px',
    lineHeight: '1.4',
    color: '#fecaca',
    background: 'rgba(127,29,29,0.45)',
    borderBottom: '1px solid rgba(248,113,113,0.3)',
  },
};
