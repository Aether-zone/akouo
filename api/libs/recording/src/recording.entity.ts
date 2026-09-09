import { Entity, ManyToOne, JoinColumn, OneToOne } from 'typeorm';

import { AuditedEntity, StoredFile } from '@akouo/common';
import { Meeting } from '@akouo/meeting';

@Entity()
export class Recording extends AuditedEntity {
  /**
   * The stored audio or video itself. One file per recording — uploading again
   * makes a new recording — so nothing else ever points at this file, and dropping
   * the file takes the recording with it.
   */
  @JoinColumn({ name: 'file_id' })
  @OneToOne(() => StoredFile, { nullable: false, onDelete: 'CASCADE' })
  file: StoredFile;

  /**
   * Owning side only: a meeting carries no `recordings` back-reference, so the
   * dependency runs one way — this library knows about meetings, not the reverse.
   */
  @JoinColumn({ name: 'meeting_id' })
  @ManyToOne(() => Meeting, { nullable: false, onDelete: 'CASCADE' })
  meeting: Meeting;
}
