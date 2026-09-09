import { DataSource } from 'typeorm';

import { StoredFile } from './file.entity';

export const FILE_REPOSITORY = 'FILE_REPOSITORY';

export const fileProviders = [
  {
    provide: FILE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(StoredFile),
    inject: ['DATA_SOURCE'],
  },
];
