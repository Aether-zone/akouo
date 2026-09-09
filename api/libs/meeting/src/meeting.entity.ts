import type { MeetingStatus } from '@akouo/contract';
import { Entity, Column, OneToMany, BeforeInsert } from 'typeorm';

import { AuditedEntity } from '@akouo/common';
import { Participant } from './participant/participant.entity';


@Entity()
export class Meeting extends AuditedEntity {
  @Column({ length: 500 })
  title: string;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @Column({ type: 'varchar', default: 'INITIAL' })
  status: MeetingStatus;

  @OneToMany(() => Participant, (participant) => participant.meeting, {
    cascade: true,
    // A participant taken off a meeting has nothing left to belong to.
    orphanedRowAction: 'delete',
  })
  participants: Participant[];

  @BeforeInsert()
  onBeforeInsert() {
    this.status = 'INITIAL';
  }

}
