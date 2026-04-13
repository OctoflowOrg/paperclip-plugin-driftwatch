import { getReact } from './bridge.js';
import type { Agent } from './types.js';

interface AgentListProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (agent: Agent) => void;
  loading: boolean;
  includedIds: string[];
  onToggleIncluded: (agentId: string) => void;
}

export function AgentList({
  agents,
  selectedId,
  onSelect,
  loading,
  includedIds,
  onToggleIncluded,
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
    borderRight: '1px solid var(--border-color, #e0e0e0)',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    fontWeight: 600,
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: 'var(--text-secondary, #666)',
    borderBottom: '1px solid var(--border-color, #e0e0e0)',
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  notice: {
    padding: '10px 16px',
    fontSize: '12px',
    lineHeight: '1.4',
    color: 'var(--text-secondary, #666)',
    background: 'var(--surface-subtle, #fafafa)',
    borderBottom: '1px solid var(--border-color-light, #f0f0f0)',
  },
  item: {
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border-color-light, #f0f0f0)',
    transition: 'background 0.15s',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  itemSelected: {
    background: 'var(--selection-bg, #e8f0fe)',
    borderLeft: '3px solid var(--accent-color, #1a73e8)',
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
    color: 'var(--text-secondary, #888)',
    marginTop: '2px',
  },
  loading: {
    padding: '16px',
    color: 'var(--text-secondary, #888)',
    fontSize: '13px',
  },
};
