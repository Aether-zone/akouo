import { DataSource } from 'typeorm';
import { Meeting } from './meeting.entity';

export const meetingProviders = [
  {
    provide: 'MEETING_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Meeting),
    inject: ['DATA_SOURCE'],
  },
];
