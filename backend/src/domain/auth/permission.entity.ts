import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ length: 100 })
  resource: string;

  @Column({ length: 50 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
