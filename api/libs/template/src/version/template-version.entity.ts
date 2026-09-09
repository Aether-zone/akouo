import type { Status } from '@akouo/contract';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { AuditedEntity } from '@akouo/common';

import { Template } from '../template.entity';

/**
 * What a template said at one point in time.
 *
 * A template is edited in place; a version is a snapshot kept beside it, so an
 * earlier wording can be read back or restored. Versions belong to their
 * template and go with it.
 */
@Entity()
export class TemplateVersion extends AuditedEntity {
    @JoinColumn({ name: 'template_id' })
    @ManyToOne(() => Template, { nullable: false, onDelete: 'CASCADE' })
    template: Template;

    /** Counts from 1 within a template, in the order the snapshots were taken. */
    @Column({ type: 'int' })
    version: number;

    @Column({ type: 'text' })
    content: string;

    /**
     * The prompt this wording was meant to be used with — the instruction around
     * the body, rather than the body itself.
     *
     * Nullable: a version taken before there was a prompt, or of a template that
     * needs none, still stands on its own.
     */
    @Column({ type: 'text', nullable: true })
    prompt: string | null;

    /**
     * Snapshots start as drafts; publishing one is a deliberate act. Defaulted in
     * the column as well, so rows that predate this read sensibly.
     */
    @Column({ type: 'varchar', default: 'DRAFT' })
    status: Status;
}
