import { Provider } from '@nestjs/common';
import { DataSource, type DataSourceOptions } from 'typeorm';

export const DATA_SOURCE = 'DATA_SOURCE';
export const DATABASE_CONFIG = 'DATABASE_CONFIG';

/**
 * What TypeORM accepts as an entity list, taken from TypeORM rather than
 * restated. Spelling it out here meant writing the bare `Function` its own type
 * uses, and re-deriving it keeps this in step if that ever changes.
 */
export type DatabaseEntities = NonNullable<DataSourceOptions['entities']>;

export interface DatabaseConfig {
  /** Path to the sqlite file, relative to the working directory. */
  database: string;
  /** Whether TypeORM syncs the schema on boot. Keep this off outside development. */
  synchronize: boolean;
}

export const defaultDatabaseConfig: DatabaseConfig = {
  database: 'db.sqlite',
  synchronize: true,
};

export const createDatabaseProviders = (
  entities: DatabaseEntities,
): Provider[] => [
  {
    provide: DATA_SOURCE,
    useFactory: async (config: DatabaseConfig) => {
      const dataSource = new DataSource({
        type: 'better-sqlite3',
        database: config.database,
        entities,

        synchronize: config.synchronize,
      });

      return dataSource.initialize();
    },
    inject: [DATABASE_CONFIG],
  },
];
