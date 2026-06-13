import { Product } from './product.entity';
import { Category } from './category.entity';
import { ProductBarcode } from './barcode.entity';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  search(query: string): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findTree(): Promise<Category[]>;
  save(category: Category): Promise<Category>;
  delete(id: string): Promise<void>;
}

export interface IBarcodeRepository {
  findByBarcode(barcode: string): Promise<ProductBarcode | null>;
  findByProduct(productId: string): Promise<ProductBarcode[]>;
  save(barcode: ProductBarcode): Promise<ProductBarcode>;
  delete(id: string): Promise<void>;
}
