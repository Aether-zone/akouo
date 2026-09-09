import { AuditedEntity } from '@akouo/common';
import { Entity, Column } from 'typeorm';

@Entity()
export class Person extends AuditedEntity {
  @Column({ length: 500 })
  name: string;
}
