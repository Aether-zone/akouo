import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { AuditedEntity } from '@akouo/common';
import { TemplateVersion } from '@akouo/template';
import { Transcription } from '@akouo/transcription';

/**
 * What came out of applying a template version to a transcription.
 *
 * The applier returns its answer and forgets it; an extraction is that answer
 * kept — so a meeting's summary can be read again without paying a model for it
 * twice, and so a later run can be compared against an earlier one.
 */
@Entity()
export class Extraction extends AuditedEntity {
  /**
   * The version that produced it. Keeping the *version* rather than the template
   * is what makes an extraction explicable: the schema and prompt behind this
   * result are the ones on that snapshot, whatever the template says now.
   */
  @JoinColumn({ name: 'template_version_id' })
  @ManyToOne(() => TemplateVersion, { nullable: false, onDelete: 'CASCADE' })
  templateVersion: TemplateVersion;

  @JoinColumn({ name: 'transcription_id' })
  @ManyToOne(() => Transcription, { nullable: false, onDelete: 'CASCADE' })
  transcription: Transcription;

  /**
   * The structured result, in whatever shape the version's schema described.
   * Stored as JSON because that shape is the template author's to decide.
   */
  @Column({ type: 'simple-json' })
  output: unknown;
}
