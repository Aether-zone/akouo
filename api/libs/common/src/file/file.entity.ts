import { Column, Entity, Index } from 'typeorm';

import { AuditedEntity } from '../database/audited-entity';

export type Status = 'INITIAL' | 'UPLOADING' | 'UPLOADED';

/**
 * A file stored on the S3-compatible object store, recorded here so the rest of the
 * application can reference it by id rather than by bucket and key.
 *
 * Named `StoredFile` rather than `File`: `File` is a global in Node's type
 * definitions, and an entity that silently shadows it makes for confusing errors.
 */
@Entity('file')
export class StoredFile extends AuditedEntity {
  /** Object key within {@link bucket}. Unique, because it is generated per upload. */
  @Index({ unique: true })
  @Column({ length: 1024 })
  key: string;

  /**
   * Bucket the object was written to. Stored per file so existing files stay
   * resolvable after the configured default bucket changes.
   */
  @Column({ length: 255 })
  bucket: string;

  /** The name the file was uploaded under. Never used to build {@link key}. */
  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  @Column({ name: 'mime_type', length: 255 })
  mimeType: string;

  /** Size in bytes, as reported when the object was written. */
  @Column({ type: 'integer' })
  size: number;

  /** Version  */
  @Column({ name: 'version_id', default: '' })
  version: string;

  @Column({ name: 'status', type: 'varchar', default: 'INITIAL' })
  status: Status;
}
