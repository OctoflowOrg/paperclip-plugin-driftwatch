import { getReact } from './bridge.js';
import type { InstructionFile } from './types.js';

interface EditorProps {
  file: InstructionFile | null;
  loading: boolean;
  agentName: string;
  readOnlyLabel: string;
}

export function Editor({
  file,
  loading,
  agentName,
  readOnlyLabel,
}: EditorProps) {
  const React = getReact();
  const { createElement: h } = React;

  if (!file && !loading) {
    return h(
      'div',
      { style: styles.empty },
      h('div', { style: styles.emptyText }, 'Select an agent to edit instructions'),
    );
  }

  if (loading) {
    return h(
      'div',
      { style: styles.empty },
      h('div', { style: styles.emptyText }, 'Loading...'),
    );
  }

  return h('div', { style: styles.container },
    h('div', { style: styles.toolbar },
      h('span', { style: styles.fileName },
        agentName,
        file ? ` / ${file.path}` : '',
      ),
      h('span', { style: styles.readOnlyBadge }, readOnlyLabel),
    ),
    h('textarea', {
      style: styles.textarea,
      value: file?.content ?? '',
      readOnly: true,
      spellCheck: false,
    }),
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
    background: 'var(--surface-bg, rgba(255,255,255,0.02))',
  },
  fileName: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary, #e5e7eb)',
  },
  readOnlyBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'var(--warning-bg, rgba(120,53,15,0.45))',
    color: 'var(--warning-text, #fcd34d)',
    fontWeight: 600,
  },
  textarea: {
    flex: 1,
    padding: '16px',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    fontSize: '12px',
    lineHeight: '1.6',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    background: 'var(--editor-bg, rgba(255,255,255,0.01))',
    color: 'var(--text-primary, #e5e7eb)',
    cursor: 'default',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary, #94a3b8)',
  },
  emptyText: {
    fontSize: '14px',
  },
};
