export interface AgentCapabilities {
  canAnswerProtocolQuestions: boolean
  canAnswerTokenQuestions: boolean
  canDescribeTooling: boolean
  canReportEcosystemNews: boolean
  canSuggestBestPractices?: boolean
  canAnalyzeOnChainData?: boolean
  canGenerateAlerts?: boolean
}

export interface AgentFlags {
  requiresExactInvocation: boolean
  noAdditionalCommentary: boolean
  caseSensitiveCommands?: boolean
  strictSchemaValidation?: boolean
}

export const SOLANA_AGENT_CAPABILITIES: AgentCapabilities = {
  canAnswerProtocolQuestions: true,
  canAnswerTokenQuestions: true,
  canDescribeTooling: true,
  canReportEcosystemNews: true,
  canSuggestBestPractices: true,
  canAnalyzeOnChainData: true,
  canGenerateAlerts: false,
}

export const SOLANA_AGENT_FLAGS: AgentFlags = {
  requiresExactInvocation: true,
  noAdditionalCommentary: true,
  caseSensitiveCommands: false,
  strictSchemaValidation: true,
}

/**
 * Utility to merge default capabilities with overrides
 */
export function createCapabilities(
  base: AgentCapabilities,
  overrides: Partial<AgentCapabilities>
): AgentCapabilities {
  return { ...base, ...overrides }
}

/**
 * Utility to merge default flags with overrides
 */
export function createFlags(
  base: AgentFlags,
  overrides: Partial<AgentFlags>
): AgentFlags {
  return { ...base, ...overrides }
}
