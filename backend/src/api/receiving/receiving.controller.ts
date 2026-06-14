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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { ReceivingOrder, ReceivingOrderStatus } from '../../domain/receiving/receiving-order.entity';
import { ReceivingOrderLine } from '../../domain/receiving/receiving-order-line.entity';
import { Product } from '../../domain/product/product.entity';
import {
  CreateReceivingOrderDto,
  UpdateReceivingOrderDto,
  UpdateStatusDto,
  ReceiveItemsDto,
  ReceivingOrderResponseDto,
  ReceivingOrderLineResponseDto,
} from './dto/receiving.dto';

@ApiTags('Receiving')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('receiving')
export class ReceivingController {
  constructor(
    @InjectRepository(ReceivingOrder)
    private readonly orderRepository: Repository<ReceivingOrder>,
    @InjectRepository(ReceivingOrderLine)
    private readonly lineRepository: Repository<ReceivingOrderLine>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List receiving orders' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<ReceivingOrderResponseDto[]> {
    const where: any = {};
    if (status) where.status = status;

    let orders: ReceivingOrder[];
    if (search) {
      orders = await this.orderRepository.find({
        where: [
          { ...where, supplier: Like(`%${search}%`) },
          { ...where, orderNumber: Like(`%${search}%`) },
        ],
        relations: ['lines'],
        order: { createdAt: 'DESC' },
      });
    } else {
      orders = await this.orderRepository.find({
        where,
        relations: ['lines'],
        order: { createdAt: 'DESC' },
      });
    }

    return Promise.all(orders.map((o) => this.toResponseDto(o)));
  }

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a receiving order' })
  async create(@Body() dto: CreateReceivingOrderDto): Promise<ReceivingOrderResponseDto> {
    const count = await this.orderRepository.count();
    const orderNumber = `PO-${String(count + 1).padStart(6, '0')}`;

    for (const line of dto.lines) {
      const product = await this.productRepository.findOne({ where: { id: line.productId } });
      if (!product) throw new BadRequestException(`Product ${line.productId} not found`);
    }

    const order = new ReceivingOrder();
    order.orderNumber = orderNumber;
    order.supplier = dto.supplier;
    order.notes = dto.notes || '';
    order.status = ReceivingOrderStatus.DRAFT;
    order.lines = dto.lines.map((l) => {
      const line = new ReceivingOrderLine();
      line.productId = l.productId;
      line.expectedQuantity = l.expectedQuantity;
      line.receivedQuantity = 0;
      return line;
    });

    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receiving order detail' })
  async findOne(@Param('id') id: string): Promise<ReceivingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Receiving order not found');
    return this.toResponseDto(order);
  }

  @Put(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update receiving order header' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReceivingOrderDto,
  ): Promise<ReceivingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Receiving order not found');
    if (order.status !== ReceivingOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be edited');
    }
    if (dto.supplier) order.supplier = dto.supplier;
    if (dto.notes !== undefined) order.notes = dto.notes;
    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  @Patch(':id/status')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update receiving order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<ReceivingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Receiving order not found');

    const validTransitions: Record<string, string[]> = {
      [ReceivingOrderStatus.DRAFT]: [ReceivingOrderStatus.IN_PROGRESS, ReceivingOrderStatus.CANCELLED],
      [ReceivingOrderStatus.IN_PROGRESS]: [ReceivingOrderStatus.COMPLETED, ReceivingOrderStatus.CANCELLED],
    };

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    if (dto.status === ReceivingOrderStatus.COMPLETED) {
      for (const line of order.lines) {
        if (Number(line.receivedQuantity) < Number(line.expectedQuantity)) {
          throw new BadRequestException(
            `Line ${line.id}: expected ${line.expectedQuantity}, received ${line.receivedQuantity}`,
          );
        }
      }
    }

    order.status = dto.status;
    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  @Patch(':id/receive')
  @Roles('Admin', 'Manager', 'Operator')
  @ApiOperation({ summary: 'Receive items against order lines' })
  async receiveItems(
    @Param('id') id: string,
    @Body() dto: ReceiveItemsDto,
  ): Promise<ReceivingOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['lines'],
    });
    if (!order) throw new NotFoundException('Receiving order not found');
    if (order.status !== ReceivingOrderStatus.IN_PROGRESS && order.status !== ReceivingOrderStatus.DRAFT) {
      throw new BadRequestException('Order must be in draft or in-progress to receive items');
    }

    if (order.status === ReceivingOrderStatus.DRAFT) {
      order.status = ReceivingOrderStatus.IN_PROGRESS;
    }

    for (const item of dto.items) {
      const line = order.lines.find((l) => l.id === item.lineId);
      if (!line) throw new NotFoundException(`Line ${item.lineId} not found`);
      line.receivedQuantity = Number(line.receivedQuantity) + item.receivedQuantity;
      if (Number(line.receivedQuantity) > Number(line.expectedQuantity)) {
        throw new BadRequestException(
          `Line ${item.lineId}: received ${line.receivedQuantity} exceeds expected ${line.expectedQuantity}`,
        );
      }
    }

    const saved = await this.orderRepository.save(order);
    return this.toResponseDto(saved);
  }

  private async toResponseDto(order: ReceivingOrder): Promise<ReceivingOrderResponseDto> {
    const productIds = order.lines.map((l) => l.productId);
    const products = productIds.length
      ? await this.productRepository.find({ where: { id: In(productIds) } })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      supplier: order.supplier,
      status: order.status,
      notes: order.notes || '',
      lines: order.lines.map((l) => ({
        id: l.id,
        receivingOrderId: l.receivingOrderId,
        productId: l.productId,
        productName: productMap.get(l.productId)?.name || '',
        productSku: productMap.get(l.productId)?.sku || '',
        expectedQuantity: Number(l.expectedQuantity),
        receivedQuantity: Number(l.receivedQuantity),
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
