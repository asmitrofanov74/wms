import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';
import { Product } from '../../domain/product/product.entity';
import { Category } from '../../domain/product/category.entity';
import { ProductUom } from '../../domain/product/product-uom.entity';
import { ProductBarcode } from '../../domain/product/barcode.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, ProductUom, ProductBarcode]),
  ],
  controllers: [ProductsController, CategoriesController],
})
export class ProductsModule {}
