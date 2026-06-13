import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustInventoryDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantityOnHand: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class InventoryItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productSku: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  locationId: string;

  @ApiProperty()
  locationCode: string;

  @ApiProperty()
  quantityOnHand: number;

  @ApiProperty()
  quantityReserved: number;

  @ApiProperty()
  availableQuantity: number;

  @ApiProperty()
  reorderPoint: number;

  @ApiProperty()
  reorderQuantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
