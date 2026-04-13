export interface Agent {
  id: string;
  name: string;
  role: string;
  title: string;
  status: string;
}

export interface InstructionFile {
  path: string;
  content: string;
  isEntry?: boolean;
}

export type FindingSeverity = 'critical' | 'warning' | 'suggestion';

export type FindingType =
  | 'ownership_conflict'
  | 'handoff_mismatch'
  | 'soft_gate'
  | 'scope_creep'
  | 'coverage_gap'
  | 'dead_output'
  | 'contradictory_rules';

export interface Finding {
  severity: FindingSeverity;
  type: FindingType;
  title: string;
  agentsInvolved: string[];
  detail: string;
  recommendation: string;
}

export interface AgentContract {
  id: string;
  roleSummary: string;
  expects: string[];
  produces: string[];
  keyRules: string[];
}

export interface AuditResult {
  inferredIntent: string;
  pipelineOrder: string[];
  agents: AgentContract[];
  findings: Finding[];
}
