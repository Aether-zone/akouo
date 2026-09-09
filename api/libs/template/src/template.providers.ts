import { DataSource } from 'typeorm';

import { Template } from './template.entity';

export const templateProviders = [
  {
    provide: 'TEMPLATE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Template),
    inject: ['DATA_SOURCE'],
  },
];
