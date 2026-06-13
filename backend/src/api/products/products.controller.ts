import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { Product } from '../../domain/product/product.entity';
import { Category } from '../../domain/product/category.entity';
import { ProductUom } from '../../domain/product/product-uom.entity';
import { ProductBarcode } from '../../domain/product/barcode.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  CreateUomDto,
  CreateBarcodeDto,
} from './dto/product.dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductUom)
    private readonly uomRepository: Repository<ProductUom>,
    @InjectRepository(ProductBarcode)
    private readonly barcodeRepository: Repository<ProductBarcode>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'active', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('active') active?: string,
  ): Promise<ProductResponseDto[]> {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (active !== undefined) where.isActive = active === 'true';

    let products: Product[];
    if (search) {
      products = await this.productRepository.find({
        where: [
          { ...where, name: Like(`%${search}%`) },
          { ...where, sku: Like(`%${search}%`) },
        ],
        relations: ['category', 'uoms', 'barcodes'],
      });
    } else {
      products = await this.productRepository.find({
        where,
        relations: ['category', 'uoms', 'barcodes'],
      });
    }

    return products.map((p) => this.toResponseDto(p));
  }

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a product' })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const existing = await this.productRepository.findOne({
      where: { sku: dto.sku },
    });
    if (existing) throw new BadRequestException('SKU already exists');

    const product = new Product();
    product.sku = dto.sku;
    product.name = dto.name;
    product.description = dto.description || '';
    product.categoryId = dto.categoryId || null;
    product.unitWeight = dto.unitWeight || 0;
    product.unitVolume = dto.unitVolume || 0;
    product.isActive = true;
    product.isTracked = dto.isTracked ?? true;

    const saved = await this.productRepository.save(product);
    return this.toResponseDto(saved);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'uoms', 'barcodes'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.toResponseDto(product);
  }

  @Put(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (dto.name) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.unitWeight !== undefined) product.unitWeight = dto.unitWeight;
    if (dto.unitVolume !== undefined) product.unitVolume = dto.unitVolume;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    if (dto.isTracked !== undefined) product.isTracked = dto.isTracked;
    const saved = await this.productRepository.save(product);
    return this.toResponseDto(saved);
  }

  @Patch(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Toggle product active status' })
  async toggleActive(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.isActive = !product.isActive;
    const saved = await this.productRepository.save(product);
    return this.toResponseDto(saved);
  }

  @Get('by-sku/:sku')
  @ApiOperation({ summary: 'Lookup product by SKU' })
  async findBySku(@Param('sku') sku: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { sku },
      relations: ['category', 'uoms', 'barcodes'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.toResponseDto(product);
  }

  @Get('by-barcode/:barcode')
  @ApiOperation({ summary: 'Lookup product by barcode scan' })
  async findByBarcode(
    @Param('barcode') barcode: string,
  ): Promise<ProductResponseDto> {
    const barcodeEntity = await this.barcodeRepository.findOne({
      where: { barcode },
      relations: ['product', 'product.category', 'product.uoms'],
    });
    if (!barcodeEntity) throw new NotFoundException('Barcode not found');
    return this.toResponseDto(barcodeEntity.product);
  }

  @Post(':id/uoms')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Add UOM to product' })
  async addUom(
    @Param('id') id: string,
    @Body() dto: CreateUomDto,
  ): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.isBase) {
      product.baseUomId = product.baseUomId || ''; // will set after save
    }

    const uom = new ProductUom();
    uom.productId = id;
    uom.uomCode = dto.uomCode;
    uom.conversionFactor = dto.conversionFactor;
    uom.isBase = dto.isBase;
    uom.weight = dto.weight || 0;
    uom.width = dto.width || 0;
    uom.height = dto.height || 0;
    uom.length = dto.length || 0;
    const savedUom = await this.uomRepository.save(uom);

    if (dto.isBase) {
      await this.productRepository.update(id, { baseUomId: savedUom.id });
    }
  }

  @Post(':id/barcodes')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Add barcode to product' })
  async addBarcode(
    @Param('id') id: string,
    @Body() dto: CreateBarcodeDto,
  ): Promise<void> {
    const barcode = new ProductBarcode();
    barcode.productId = id;
    barcode.barcode = dto.barcode;
    barcode.uomId = dto.uomId || null;
    barcode.isPrimary = dto.isPrimary || false;
    await this.barcodeRepository.save(barcode);
  }

  private toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId || '',
      categoryName: product.category?.name || '',
      baseUomId: product.baseUomId || '',
      unitWeight: product.unitWeight || 0,
      unitVolume: product.unitVolume || 0,
      isActive: product.isActive,
      isTracked: product.isTracked,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
