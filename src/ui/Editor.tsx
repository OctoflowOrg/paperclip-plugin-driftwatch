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
    borderBottom: '1px solid var(--border-color, #e0e0e0)',
    background: 'var(--surface-bg, #fafafa)',
  },
  fileName: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary, #333)',
  },
  readOnlyBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'var(--warning-bg, #fff3cd)',
    color: 'var(--warning-text, #856404)',
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
    background: 'var(--editor-bg, #fff)',
    color: 'var(--text-primary, #1a1a1a)',
    cursor: 'default',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary, #999)',
  },
  emptyText: {
    fontSize: '14px',
  },
};
