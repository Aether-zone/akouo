import type { ContentOrigin } from '@akouo/contract';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '@akouo/common';
import { Participant } from '@akouo/meeting';

import { Transcription } from '../transcription.entity';

/**
 * One turn of speech within a transcription: who said it, what they said, and where
 * in the recording it falls. A transcription's `content` is the same words run
 * together, so utterances are what make it seekable and attributable.
 */
@Entity()
export class Utterance extends BaseEntity {
  @JoinColumn({ name: 'transcription_id' })
  @ManyToOne(() => Transcription, (transcription) => transcription.utterances, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  transcription: Transcription;

  /**
   * The label diarization gave this voice — "A", "B" — which identifies a speaker
   * only within this transcription, and says nothing about who they are.
   */
  @Column({ name: 'speaker_label' })
  speakerLabel: string;

  /**
   * The meeting participant behind that label, once someone has matched them up.
   * Null until then, which is the normal state of a fresh transcription — and null
   * again if the participant is later removed from the meeting, since losing the
   * attribution is no reason to lose what was said.
   *
   * Owning side only: a participant carries no `utterances` back-reference, so the
   * dependency on `@akouo/meeting` runs one way.
   */
  @JoinColumn({ name: 'participant_id' })
  @ManyToOne(() => Participant, { nullable: true, onDelete: 'SET NULL' })
  participant: Participant | null;

  @Column({ type: 'text' })
  content: string;

  /**
   * Per turn, so a corrected line stands out from the ones around it: a person who
   * fixes one utterance marks that utterance `MANUAL`, and leaves the rest as the
   * transcriber left them.
   */
  @Column({ type: 'varchar', default: 'TRANSCRIBED' })
  origin: ContentOrigin;

  /** How sure the transcriber is of these words, 0 to 1. */
  @Column({ type: 'float' })
  confidence: number;

  /** Offset into the recording where the turn starts, in milliseconds. */
  @Column({ type: 'int' })
  start: number;

  /** Offset where it ends, in milliseconds. */
  @Column({ type: 'int' })
  end: number;
}
