import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { ShippingOrder, ShippingOrderStatus } from '../../domain/shipping/shipping-order.entity';
import { ShippingOrderLine } from '../../domain/shipping/shipping-order-line.entity';
import { Product } from '../../domain/product/product.entity';
import {
  CreateShippingOrderDto,
  UpdateShippingOrderDto,
  UpdateStatusDto,
  PickItemsDto,
  PackItemsDto,
  ShippingOrderResponseDto,
  ShippingOrderLineResponseDto,
} from './dto/shipping.dto';
import { paginate, PaginatedResult } from '../../application/common/pagination/pagination.service';

@ApiTags('Shipping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipping')
export class ShippingController {
  constructor(
    @InjectRepository(ShippingOrder)
    private readonly orderRepository: Repository<ShippingOrder>,
    @InjectRepository(ShippingOrderLine)
    private readonly lineRepository: Repository<ShippingOrderLine>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List shipping orders' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<PaginatedResult<ShippingOrderResponseDto>> {
    const where: any = {};
    if (status) where.status = status;

    const result = await paginate(this.orderRepository, { page, limit }, {
      where: search
        ? [{ ...where, customer: Like(`%${search}%`) }, { ...where, orderNumber: Like(`%${search}%`) }]
        : where,
      relations: ['lines'],
      order: { createdAt: 'DESC' } as any,
    });

    const data = await Promise.all(result.data.map((o) => this.toResponseDto(o)));
    return { data, meta: result.meta };
  }

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a shipping order' })
  async create(@Body() dto: CreateShippingOrderDto): Promise<ShippingOrderResponseDto> {
    const result = await this.orderRepository.query(`SELECT nextval('shipping_order_seq') AS seq`);
    const seq = result[0]?.seq || 1;
    const orderNumber = `SO-${String(seq).padStart(6, '0')}`;

    const productIds = [...new Set(dto.lines.map((l) => l.productId))];
    const existingProducts = await this.productRepository.find({
      where: { id: In(productIds) },
      select: ['id'],
    });
    const existingIds = new Set(existingProducts.map((p) => p.id));
    for (const line of dto.lines) {
      if (!existingIds.has(line.productId)) {
        throw new BadRequestException(`Product ${line.productId} not found`);
      }
    }

    const order = new ShippingOrder();
    order.orderNumber = orderNumber;
    order.customer = dto.customer;
    order.shipToAddress = dto.shipToAddress || '';
    order.notes = dto.notes || '';
    order.status = ShippingOrderStatus.DRAFT;
    order.lines = dto.lines.map((l) => {
      const line = new ShippingOrderLine();
      line.productId = l.productId;
      line.orderedQuantity = l.orderedQuantity;
      line.pickedQuantity = 0;
      line.packedQuantity = 0;
      line.shippedQuantity = 0;
      return line;
    });

    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipping order detail' })
  async findOne(@Param('id') id: string): Promise<ShippingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Shipping order not found');
    return this.toResponseDto(order);
  }

  @Put(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update shipping order header' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShippingOrderDto,
  ): Promise<ShippingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Shipping order not found');
    if (order.status !== ShippingOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be edited');
    }
    if (dto.customer) order.customer = dto.customer;
    if (dto.shipToAddress !== undefined) order.shipToAddress = dto.shipToAddress;
    if (dto.notes !== undefined) order.notes = dto.notes;
    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  @Patch(':id/status')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update shipping order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<ShippingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Shipping order not found');

    const validTransitions: Record<string, string[]> = {
      [ShippingOrderStatus.DRAFT]: [ShippingOrderStatus.PICKING, ShippingOrderStatus.CANCELLED],
      [ShippingOrderStatus.PICKING]: [ShippingOrderStatus.PACKING, ShippingOrderStatus.CANCELLED],
      [ShippingOrderStatus.PACKING]: [ShippingOrderStatus.SHIPPED, ShippingOrderStatus.CANCELLED],
    };

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    if (dto.status === ShippingOrderStatus.SHIPPED) {
      for (const line of order.lines) {
        if (Number(line.packedQuantity) < Number(line.orderedQuantity)) {
          throw new BadRequestException(
            `Line ${line.id}: packed ${line.packedQuantity} of ${line.orderedQuantity}`,
          );
        }
      }
    }

    order.status = dto.status;
    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  @Patch(':id/pick')
  @Roles('Admin', 'Manager', 'Operator')
  @ApiOperation({ summary: 'Pick items for shipping order' })
  async pickItems(
    @Param('id') id: string,
    @Body() dto: PickItemsDto,
  ): Promise<ShippingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Shipping order not found');
    if (order.status === ShippingOrderStatus.SHIPPED || order.status === ShippingOrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pick items on a shipped or cancelled order');
    }

    if (order.status === ShippingOrderStatus.DRAFT) {
      order.status = ShippingOrderStatus.PICKING;
    }

    for (const item of dto.items) {
      const line = order.lines.find((l) => l.id === item.lineId);
      if (!line) throw new NotFoundException(`Line ${item.lineId} not found`);
      line.pickedQuantity = Number(line.pickedQuantity) + item.quantity;
      if (Number(line.pickedQuantity) > Number(line.orderedQuantity)) {
        throw new BadRequestException(
          `Line ${item.lineId}: picked ${line.pickedQuantity} exceeds ordered ${line.orderedQuantity}`,
        );
      }
    }

    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  @Patch(':id/pack')
  @Roles('Admin', 'Manager', 'Operator')
  @ApiOperation({ summary: 'Pack items for shipping order' })
  async packItems(
    @Param('id') id: string,
    @Body() dto: PackItemsDto,
  ): Promise<ShippingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Shipping order not found');
    if (order.status === ShippingOrderStatus.SHIPPED || order.status === ShippingOrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pack items on a shipped or cancelled order');
    }

    if (order.status === ShippingOrderStatus.DRAFT) {
      order.status = ShippingOrderStatus.PICKING;
    }

    for (const item of dto.items) {
      const line = order.lines.find((l) => l.id === item.lineId);
      if (!line) throw new NotFoundException(`Line ${item.lineId} not found`);
      if (Number(line.pickedQuantity) + item.quantity > Number(line.orderedQuantity)) {
        throw new BadRequestException(
          `Line ${item.lineId}: cannot pack ${item.quantity} (picked: ${line.pickedQuantity}, ordered: ${line.orderedQuantity})`,
        );
      }
      line.packedQuantity = Number(line.packedQuantity) + item.quantity;
    }

    // Auto-advance to PACKING if currently in DRAFT or PICKING
    if (order.status === ShippingOrderStatus.DRAFT || order.status === ShippingOrderStatus.PICKING) {
      order.status = ShippingOrderStatus.PACKING;
    }

    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  private async toResponseDto(order: ShippingOrder): Promise<ShippingOrderResponseDto> {
    const productIds = order.lines.map((l) => l.productId);
    const products = productIds.length
      ? await this.productRepository.find({ where: { id: In(productIds) } })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      shipToAddress: order.shipToAddress || '',
      status: order.status,
      notes: order.notes || '',
      lines: order.lines.map((l) => ({
        id: l.id,
        shippingOrderId: l.shippingOrderId,
        productId: l.productId,
        productName: productMap.get(l.productId)?.name || '',
        productSku: productMap.get(l.productId)?.sku || '',
        orderedQuantity: Number(l.orderedQuantity),
        pickedQuantity: Number(l.pickedQuantity),
        packedQuantity: Number(l.packedQuantity),
        shippedQuantity: Number(l.shippedQuantity),
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
