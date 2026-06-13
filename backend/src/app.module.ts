import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';
import { RolesModule } from './api/roles/roles.module';
import { WarehousesModule } from './api/warehouses/warehouses.module';
import { ProductsModule } from './api/products/products.module';
import { ReceivingModule } from './api/receiving/receiving.module';
import { ShippingModule } from './api/shipping/shipping.module';
import { SeedModule } from './infrastructure/persistence/seeds/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CqrsModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    WarehousesModule,
    ProductsModule,
    ReceivingModule,
    ShippingModule,
    SeedModule,
  ],
})
export class AppModule {}
