import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingOrderStatus } from '../../../domain/shipping/shipping-order.entity';

export class ShippingLineDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  orderedQuantity: number;
}

export class CreateShippingOrderDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  customer: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shipToAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [ShippingLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingLineDto)
  lines: ShippingLineDto[];
}

export class UpdateShippingOrderDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  customer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shipToAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ShippingOrderStatus })
  @IsEnum(ShippingOrderStatus)
  status: string;
}

export class LineItemDto {
  @ApiProperty()
  @IsString()
  lineId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class PickItemsDto {
  @ApiProperty({ type: [LineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  items: LineItemDto[];
}

export class PackItemsDto {
  @ApiProperty({ type: [LineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  items: LineItemDto[];
}

export class ShippingOrderLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shippingOrderId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productSku: string;

  @ApiProperty()
  orderedQuantity: number;

  @ApiProperty()
  pickedQuantity: number;

  @ApiProperty()
  packedQuantity: number;

  @ApiProperty()
  shippedQuantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ShippingOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  customer: string;

  @ApiProperty()
  shipToAddress: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  notes: string;

  @ApiProperty({ type: [ShippingOrderLineResponseDto] })
  lines: ShippingOrderLineResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
