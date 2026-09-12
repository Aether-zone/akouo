import type { MeetingStatus } from '@akouo/contract';
import { Entity, Column, ManyToOne, JoinColumn, OneToMany, BeforeInsert, Index } from 'typeorm';

import { AuditedEntity } from '@akouo/common';
import { Location } from '@akouo/location/location.entity';
import { Participant } from './participant/participant.entity';


@Index(['organizationId', 'sourceUri'], {
  unique: true,
  // Only meetings projected from an aether event participate; one scheduled
  // in akouo has a null here, and SQLite would otherwise allow just one of
  // those per organization.
  where: '"source_uri" IS NOT NULL',
})
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

  /**
   * Where the meeting is, if anywhere.
   *
   * Nullable because plenty of meetings have no place — a call is not
   * somewhere. `SET NULL` rather than `CASCADE`: a location going away must
   * not take the meeting with it. In practice a location is never deleted
   * (topos deleting a place only unlinks it), so this is the belt to that
   * braces.
   */
  @JoinColumn({ name: 'location_id' })
  @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
  location: Location | null;

  /**
   * The IRI of the aether event this was projected from —
   * `urn:aether:event:{id}` in chronos.
   *
   * The key that makes an at-least-once delivery safe: without it a
   * redelivered `event.created` would file a second meeting with the same
   * title, and nothing could tell them apart afterwards.
   *
   * Null for a meeting scheduled in akouo itself. That distinction matters
   * more than it looks: a projected meeting is aether's to change, and akouo
   * overwriting one would have its edit silently reverted by the next event.
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'source_uri' })
  sourceUri: string | null;
}
