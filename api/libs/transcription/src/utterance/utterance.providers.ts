import { DataSource } from 'typeorm';

import { Utterance } from './utterance.entity';

export const utteranceProviders = [
  {
    provide: 'UTTERANCE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Utterance),
    inject: ['DATA_SOURCE'],
  },
];
