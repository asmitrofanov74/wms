import { Entity, Column, Tree, TreeChildren, TreeParent } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity('categories')
@Tree('materialized-path')
export class Category extends BaseEntity {
  @Column({ length: 20 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  path: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;
}
