import { DataSource } from 'typeorm';
import { Meeting } from './meeting.entity';
import { Person } from '@akouo/person/person.entity';
import { Location } from '@akouo/location/location.entity';

export const meetingProviders = [
  {
    provide: 'MEETING_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Meeting),
    inject: ['DATA_SOURCE'],
  },
  /*
   * The people repository, so a meeting can check that someone may still be
   * added to one. Declared here rather than injecting `PersonService`, which
   * would be circular — `PersonModule` already imports `MeetingModule` to
   * answer "which meetings was this person in".
   *
   * Two providers over one `DataSource` is not two repositories: TypeORM
   * returns the same instance for the same entity.
   */
  {
    provide: 'MEETING_PERSON_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Person),
    inject: ['DATA_SOURCE'],
  },
  /*
   * Locations, so a projected meeting can be put in the place the document
   * names. Declared here rather than injecting `LocationService`, which would
   * be the second half of a cycle.
   */
  {
    provide: 'MEETING_LOCATION_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Location),
    inject: ['DATA_SOURCE'],
  },
];
