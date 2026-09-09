import { Entity, Column } from 'typeorm';

import { AuditedEntity } from '@akouo/common';

/**
 * A reusable piece of text, kept so it can be applied again — the shape of a
 * meeting summary, the wording of a prompt.
 *
 * What fills it in is left to whatever renders it; this only holds the text.
 */
@Entity()
export class Template extends AuditedEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** The template body itself. */
  @Column({ type: 'text' })
  content: string;
}
