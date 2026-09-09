import {
  DynamicModule,
  Global,
  Module,
  ModuleMetadata,
  Provider,
} from '@nestjs/common';

import { AsyncModuleConfig } from '../config';
import {
  createDatabaseProviders,
  DATABASE_CONFIG,
  DatabaseConfig,
  DatabaseEntities,
  defaultDatabaseConfig,
} from './database.providers';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(
    entities: DatabaseEntities,
    config: DatabaseConfig = defaultDatabaseConfig,
  ): DynamicModule {
    return DatabaseModule.create(entities, {
      provide: DATABASE_CONFIG,
      useValue: config,
    });
  }

  static forRootAsync(
    entities: DatabaseEntities,
    options: AsyncModuleConfig<DatabaseConfig>,
  ): DynamicModule {
    return DatabaseModule.create(
      entities,
      {
        provide: DATABASE_CONFIG,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      },
      options.imports,
    );
  }

  private static create(
    entities: DatabaseEntities,
    configProvider: Provider,
    imports: ModuleMetadata['imports'] = [],
  ): DynamicModule {
    const providers = createDatabaseProviders(entities);

    return {
      module: DatabaseModule,
      imports,
      providers: [configProvider, ...providers],
      exports: providers,
    };
  }
}
