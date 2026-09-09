import { Inject, Injectable } from '@nestjs/common';

import { AI_CONFIG, type AiConfig } from './ai.config';

/*
 * Both SDK packages are ESM and this build is CommonJS. A type-only import has
 * to say how it resolves; a value import cannot happen at all, so `ai` is
 * imported where it is used, inside `embed`.
 */
import type {
  EmbeddingModelV4,
  LanguageModelV4,
  ProviderV4,
} from '@ai-sdk/provider' with { 'resolution-mode': 'import' };


@Injectable()
export class AIProvider {

  constructor(@Inject(AI_CONFIG) private readonly config: AiConfig) { }

  get aiSdk(): ProviderV4 {
    return this.config.provider;
  }

  get embeddingModel(): EmbeddingModelV4 {
    return this.aiSdk.embeddingModel(this.config.embeddingModel);
  }

  get languageModel(): LanguageModelV4 {
    return this.aiSdk.languageModel(this.config.languageModel);
  }

  async embed(input: string): Promise<number[]> {
    const { embed } = await import('ai');

    const embedding = await embed({
      model: this.embeddingModel,
      value: input
    })

    return embedding.embedding;
  }

}
