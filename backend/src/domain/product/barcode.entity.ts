import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Product } from './product.entity';
import { ProductUom } from './product-uom.entity';

@Entity('product_barcodes')
@Index(['productId'])
export class ProductBarcode extends BaseEntity {
  @ManyToOne(() => Product, (p) => p.barcodes)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductUom)
  @JoinColumn({ name: 'uom_id' })
  uom: ProductUom;

  @Column({ name: 'uom_id', nullable: true, type: 'varchar' })
  uomId: string | null;

  @Column({ unique: true, length: 100 })
  barcode: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;
}
