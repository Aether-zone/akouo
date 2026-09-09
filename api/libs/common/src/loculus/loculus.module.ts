import type { AsyncModuleConfig } from '@aether-zone/organon';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import type { ModuleMetadata } from '@nestjs/common';

import { LoculusClient } from './loculus.client';
import { ServiceToken } from './service-token';
import {
  defaultLoculusConfig,
  LOCULUS_CONFIG,
  type LoculusConfig,
} from './loculus.config';

/**
 * Provides {@link LoculusClient} application-wide, so any module can ask for a
 * presigned URL without wiring the object store's address itself.
 *
 * Global for the same reason `FileModule` is — and it is what will replace it:
 * once recordings are stored through loculus, akouo holds no bucket
 * credentials and streams no uploads of its own.
 */
@Global()
@Module({})
export class LoculusModule {
  static forRoot(config: LoculusConfig = defaultLoculusConfig): DynamicModule {
    return LoculusModule.create({
      provide: LOCULUS_CONFIG,
      useValue: config,
    });
  }

  static forRootAsync(
    options: AsyncModuleConfig<LoculusConfig>,
  ): DynamicModule {
    return LoculusModule.create(
      {
        provide: LOCULUS_CONFIG,
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
      module: LoculusModule,
      imports,
      providers: [configProvider, ServiceToken, LoculusClient],
      exports: [LoculusClient, LOCULUS_CONFIG],
    };
  }
}
