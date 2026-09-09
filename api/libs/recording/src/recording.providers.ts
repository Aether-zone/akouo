import { DataSource } from 'typeorm';
import { Recording } from './recording.entity';

export const recordingProviders = [
  {
    provide: 'RECORDING_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Recording),
    inject: ['DATA_SOURCE'],
  },
];
