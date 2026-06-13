import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Product } from './product.entity';

@Entity('product_uoms')
export class ProductUom extends BaseEntity {
  @ManyToOne(() => Product, (p) => p.uoms)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ length: 10 })
  uomCode: string;

  @Column({ name: 'conversion_factor', type: 'decimal', precision: 10, scale: 4, default: 1 })
  conversionFactor: number;

  @Column({ name: 'is_base', default: false })
  isBase: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  width: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  height: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  length: number;
}
