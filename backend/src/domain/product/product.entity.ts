import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Category } from './category.entity';
import { ProductUom } from './product-uom.entity';
import { ProductBarcode } from './barcode.entity';

@Entity('products')
@Index(['categoryId'])
@Index(['name'])
export class Product extends BaseEntity {
  @Column({ unique: true, length: 50 })
  sku: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', nullable: true, type: 'varchar' })
  categoryId: string | null;

  @Column({ name: 'base_uom_id', nullable: true, type: 'varchar' })
  baseUomId: string | null;

  @Column({ name: 'unit_weight', type: 'decimal', precision: 10, scale: 3, nullable: true })
  unitWeight: number;

  @Column({ name: 'unit_volume', type: 'decimal', precision: 10, scale: 3, nullable: true })
  unitVolume: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_tracked', default: true })
  isTracked: boolean;

  @OneToMany(() => ProductUom, (uom) => uom.product)
  uoms: ProductUom[];

  @OneToMany(() => ProductBarcode, (barcode) => barcode.product)
  barcodes: ProductBarcode[];
}
