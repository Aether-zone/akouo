import { DataSource } from 'typeorm';

import { TemplateVersion } from './template-version.entity';

export const templateVersionProviders = [
  {
    provide: 'TEMPLATE_VERSION_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(TemplateVersion),
    inject: ['DATA_SOURCE'],
  },
];
