import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ProductsController } from './products.controller';
import { Product } from '../../domain/product/product.entity';
import { Category } from '../../domain/product/category.entity';
import { ProductUom } from '../../domain/product/product-uom.entity';
import { ProductBarcode } from '../../domain/product/barcode.entity';
import { CreateProductDto, UpdateProductDto, CreateUomDto, CreateBarcodeDto } from './dto/product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productRepository: jest.Mocked<Repository<Product>>;
  let categoryRepository: jest.Mocked<Repository<Category>>;
  let uomRepository: jest.Mocked<Repository<ProductUom>>;
  let barcodeRepository: jest.Mocked<Repository<ProductBarcode>>;

  const mockProduct: Product = {
    id: 'prod-1', sku: 'SKU001', name: 'Test Product', description: 'A test product',
    categoryId: 'cat-1', category: { id: 'cat-1', name: 'Electronics' } as Category,
    baseUomId: 'uom-1', unitWeight: 1.5, unitVolume: 0.5,
    isActive: true, isTracked: true, uoms: [], barcodes: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductUom),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductBarcode),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productRepository = module.get(getRepositoryToken(Product));
    categoryRepository = module.get(getRepositoryToken(Category));
    uomRepository = module.get(getRepositoryToken(ProductUom));
    barcodeRepository = module.get(getRepositoryToken(ProductBarcode));
  });

  describe('findAll', () => {
    it('should return all products with relations', async () => {
      productRepository.find.mockResolvedValue([mockProduct]);
      const result = await controller.findAll();
      expect(result.length).toBe(1);
      expect(result[0].sku).toBe('SKU001');
    });

    it('should filter by categoryId', async () => {
      productRepository.find.mockResolvedValue([mockProduct]);
      await controller.findAll(undefined, 'cat-1');
      expect(productRepository.find).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
        relations: ['category', 'uoms', 'barcodes'],
      });
    });

    it('should search by name or sku', async () => {
      productRepository.find.mockResolvedValue([mockProduct]);
      await controller.findAll('SKU');
      const callArg = productRepository.find.mock.calls[0][0] as any;
      expect(callArg.where).toBeDefined();
      expect(Array.isArray(callArg.where)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const dto: CreateProductDto = { sku: 'SKU002', name: 'New Product' };
      productRepository.findOne.mockResolvedValue(null);
      productRepository.save.mockResolvedValue({ ...mockProduct, id: 'prod-2', sku: 'SKU002', name: 'New Product' });

      const result = await controller.create(dto);

      expect(result.sku).toBe('SKU002');
    });

    it('should throw BadRequestException when SKU already exists', async () => {
      const dto: CreateProductDto = { sku: 'SKU001', name: 'Duplicate' };
      productRepository.findOne.mockResolvedValue(mockProduct);
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return product by id', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      const result = await controller.findOne('prod-1');
      expect(result.sku).toBe('SKU001');
    });

    it('should throw NotFoundException when not found', async () => {
      productRepository.findOne.mockResolvedValue(null);
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product fields', async () => {
      const dto: UpdateProductDto = { name: 'Updated Name' };
      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({ ...mockProduct, name: 'Updated Name' });

      const result = await controller.update('prod-1', dto);

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct, isActive: true });
      productRepository.save.mockResolvedValue({ ...mockProduct, isActive: false });

      const result = await controller.toggleActive('prod-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('findBySku', () => {
    it('should return product by SKU', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      const result = await controller.findBySku('SKU001');
      expect(result.sku).toBe('SKU001');
    });
  });

  describe('findByBarcode', () => {
    it('should return product by barcode', async () => {
      barcodeRepository.findOne.mockResolvedValue({ product: mockProduct } as ProductBarcode);
      const result = await controller.findByBarcode('BARCODE001');
      expect(result.sku).toBe('SKU001');
    });

    it('should throw NotFoundException when barcode not found', async () => {
      barcodeRepository.findOne.mockResolvedValue(null);
      await expect(controller.findByBarcode('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addUom', () => {
    it('should add UOM to product', async () => {
      const dto: CreateUomDto = { uomCode: 'EA', conversionFactor: 1, isBase: true };
      productRepository.findOne.mockResolvedValue(mockProduct);
      uomRepository.save.mockResolvedValue({ id: 'uom-new' } as ProductUom);

      await controller.addUom('prod-1', dto);

      expect(uomRepository.save).toHaveBeenCalled();
      expect(productRepository.update).toHaveBeenCalledWith('prod-1', { baseUomId: 'uom-new' });
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);
      await expect(controller.addUom('nonexistent', {} as CreateUomDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addBarcode', () => {
    it('should add barcode to product', async () => {
      const dto: CreateBarcodeDto = { barcode: 'BARCODE002', isPrimary: true };
      barcodeRepository.save.mockResolvedValue({} as ProductBarcode);

      await controller.addBarcode('prod-1', dto);

      expect(barcodeRepository.save).toHaveBeenCalled();
    });
  });
});
