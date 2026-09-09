import type { ProviderV4 } from '@ai-sdk/provider' with { 'resolution-mode': 'import' };

export const AI_CONFIG = 'AI_CONFIG';

/** What the AI library needs to reach a model. */
export interface AiConfig {
  provider: ProviderV4
  embeddingModel: string
  languageModel: string
}
