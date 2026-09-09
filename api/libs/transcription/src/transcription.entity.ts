import type { ContentOrigin } from '@akouo/contract';
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import { AuditedEntity } from '@akouo/common';
import { Recording } from '@akouo/recording';

import { Utterance } from './utterance/utterance.entity';

@Entity()
export class Transcription extends AuditedEntity {
  @Column({ type: 'text' })
  content: string;

  /**
   * `TRANSCRIBED` as written by a transcriber, and `MANUAL` from the moment a person
   * edits it through the API. Defaulted in the column as well as in the mapper, so
   * rows that predate this stay readable.
   */
  @Column({ type: 'varchar', default: 'TRANSCRIBED' })
  origin: ContentOrigin;

  /** The same words as `content`, split into turns and attributed to a speaker. */
  @OneToMany(() => Utterance, (utterance) => utterance.transcription)
  utterances: Utterance[];

  /**
   * Owning side only: Recording carries no `transcriptions` back-reference, so the
   * dependency between the two libraries runs one way. Deleting a recording still
   * takes its transcriptions with it — that is the FK's `ON DELETE CASCADE`, not
   * the relation being bidirectional.
   */
  @JoinColumn({ name: 'recording_id' })
  @ManyToOne(() => Recording, { nullable: false, onDelete: 'CASCADE' })
  recording: Recording;
}
