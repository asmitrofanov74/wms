import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { InventoryItem } from '../../domain/inventory/inventory-item.entity';
import { Product } from '../../domain/product/product.entity';
import {
  AdjustInventoryDto,
  InventoryItemResponseDto,
} from './dto/inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'lowStock', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ): Promise<InventoryItemResponseDto[]> {
    let items: InventoryItem[];

    if (search) {
      const products = await this.productRepository.find({
        where: [
          { name: Like(`%${search}%`) },
          { sku: Like(`%${search}%`) },
        ],
      });
      const productIds = products.map((p) => p.id);
      if (productIds.length > 0) {
        items = await this.inventoryRepository.find({
          where: productIds.map((id) => ({ productId: id })),
          relations: ['product'],
          order: { updatedAt: 'DESC' },
        });
      } else {
        items = [];
      }
    } else {
      items = await this.inventoryRepository.find({
        relations: ['product'],
        order: { updatedAt: 'DESC' },
      });
    }

    let result = items.map((item) => this.toResponseDto(item));

    if (lowStock === 'true') {
      result = result.filter(
        (item) =>
          item.reorderPoint > 0 && item.quantityOnHand <= item.reorderPoint,
      );
    }

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item detail' })
  async findOne(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    const item = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return this.toResponseDto(item);
  }

  @Patch(':id/adjust')
  @Roles('Admin', 'Manager', 'Operator')
  @ApiOperation({ summary: 'Adjust inventory quantity (cycle count)' })
  async adjust(
    @Param('id') id: string,
    @Body() dto: AdjustInventoryDto,
  ): Promise<InventoryItemResponseDto> {
    const item = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    if (dto.quantityOnHand < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    item.quantityOnHand = dto.quantityOnHand;
    const saved = await this.inventoryRepository.save(item);
    return this.toResponseDto(saved);
  }

  private toResponseDto(item: InventoryItem): InventoryItemResponseDto {
    const qoh = Number(item.quantityOnHand);
    const reserved = Number(item.quantityReserved);
    return {
      id: item.id,
      productId: item.productId,
      productSku: item.product?.sku || '',
      productName: item.product?.name || '',
      locationId: item.locationId || '',
      locationCode: '',
      quantityOnHand: qoh,
      quantityReserved: reserved,
      availableQuantity: qoh - reserved,
      reorderPoint: Number(item.reorderPoint) || 0,
      reorderQuantity: Number(item.reorderQuantity) || 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
