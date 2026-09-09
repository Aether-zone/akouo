import { Entity, ManyToOne, JoinColumn } from 'typeorm';

import { Meeting } from '../meeting.entity';
import { BaseEntity } from '@akouo/common';
import { Person } from '@akouo/person/person.entity';

@Entity()
export class Participant extends BaseEntity {
  @JoinColumn({ name: 'meeting_id' })
  @ManyToOne(() => Meeting, (meeting) => meeting.participants, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  meeting: Meeting;

  @JoinColumn({ name: 'person_id' })
  @ManyToOne(() => Person, { nullable: false, onDelete: 'CASCADE' })
  person: Person;
}
