import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../../../domain/auth/user.entity';
import { Role } from '../../../domain/auth/role.entity';
import { Permission } from '../../../domain/auth/permission.entity';
import { RefreshToken } from '../../../domain/auth/refresh-token.entity';
import { Warehouse } from '../../../domain/warehouse/warehouse.entity';
import { WarehouseZone } from '../../../domain/warehouse/zone.entity';
import { BinLocation } from '../../../domain/warehouse/location.entity';
import { Product } from '../../../domain/product/product.entity';
import { Category } from '../../../domain/product/category.entity';
import { ProductUom } from '../../../domain/product/product-uom.entity';
import { ProductBarcode } from '../../../domain/product/barcode.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      database: this.configService.get<string>('DB_NAME', 'wms'),
      username: this.configService.get<string>('DB_USER', 'wms'),
      password: this.configService.get<string>('DB_PASSWORD', 'wms_secret'),
      entities: [
        User, Role, Permission, RefreshToken,
        Warehouse, WarehouseZone, BinLocation,
        Product, Category, ProductUom, ProductBarcode,
      ],
      migrations: [__dirname + '/../migrations/*.ts'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: this.configService.get<string>('NODE_ENV') === 'development',
    };
  }
}
