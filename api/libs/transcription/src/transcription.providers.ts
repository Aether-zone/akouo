import { DataSource } from 'typeorm';
import { Transcription } from './transcription.entity';

export const transcriptionProviders = [
  {
    provide: 'TRANSCRIPTION_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Transcription),
    inject: ['DATA_SOURCE'],
  },
];
