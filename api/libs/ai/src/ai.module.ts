import { DynamicModule, Global, Module, ModuleMetadata, Provider } from '@nestjs/common';

import { AsyncModuleConfig } from '@akouo/common';

import { AIProvider } from './ai.provider';
import { AI_CONFIG, AiConfig } from './ai.config';

@Global()
@Module({})
export class AIModule {
  static forRoot(config: AiConfig): DynamicModule {
    return AIModule.create({
      provide: AI_CONFIG,
      useValue: config,
    });
  }

  static forRootAsync(options: AsyncModuleConfig<AiConfig>): DynamicModule {
    return AIModule.create(
      {
        provide: AI_CONFIG,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      },
      options.imports,
    );
  }

  private static create(
    configProvider: Provider,
    imports: ModuleMetadata['imports'] = [],
  ): DynamicModule {
    return {
      module: AIModule,
      imports,
      providers: [configProvider, AIProvider],
      exports: [AIProvider, configProvider],
    };
  }
}
