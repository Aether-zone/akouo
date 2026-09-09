import { DataSource } from 'typeorm';

import { Extraction } from './extraction.entity';

export const extractionProviders = [
  {
    provide: 'EXTRACTION_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Extraction),
    inject: ['DATA_SOURCE'],
  },
];
