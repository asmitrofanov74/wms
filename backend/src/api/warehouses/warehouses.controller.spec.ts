import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehousesController } from './warehouses.controller';
import { Warehouse } from '../../domain/warehouse/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

describe('WarehousesController', () => {
  let controller: WarehousesController;
  let warehouseRepository: jest.Mocked<Repository<Warehouse>>;

  const mockWarehouse: Warehouse = {
    id: 'wh-1', code: 'WH01', name: 'Main Warehouse', address: '123 Main St',
    isActive: true, zones: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehousesController],
      providers: [
        {
          provide: getRepositoryToken(Warehouse),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WarehousesController>(WarehousesController);
    warehouseRepository = module.get(getRepositoryToken(Warehouse));
  });

  describe('findAll', () => {
    it('should return all warehouses', async () => {
      warehouseRepository.find.mockResolvedValue([mockWarehouse]);
      const result = await controller.findAll();
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('WH01');
    });
  });

  describe('create', () => {
    it('should create a warehouse', async () => {
      const dto: CreateWarehouseDto = { code: 'WH02', name: 'New Warehouse', address: '456 Oak Ave' };
      warehouseRepository.save.mockResolvedValue({ ...mockWarehouse, id: 'wh-2', code: 'WH02', name: 'New Warehouse' });

      const result = await controller.create(dto);

      expect(result.code).toBe('WH02');
      expect(result.name).toBe('New Warehouse');
    });

    it('should default address to empty string', async () => {
      const dto: CreateWarehouseDto = { code: 'WH02', name: 'New Warehouse' };
      warehouseRepository.save.mockResolvedValue({ ...mockWarehouse, id: 'wh-2', code: 'WH02', name: 'New Warehouse', address: '' });
      const result = await controller.create(dto);
      expect(result.address).toBe('');
    });
  });

  describe('findOne', () => {
    it('should return warehouse with zones and locations', async () => {
      warehouseRepository.findOne.mockResolvedValue(mockWarehouse);
      const result = await controller.findOne('wh-1');
      expect(result.id).toBe('wh-1');
    });

    it('should throw NotFoundException when not found', async () => {
      warehouseRepository.findOne.mockResolvedValue(null);
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update warehouse fields', async () => {
      const dto: UpdateWarehouseDto = { name: 'Updated WH' };
      warehouseRepository.findOne.mockResolvedValue(mockWarehouse);
      warehouseRepository.save.mockResolvedValue({ ...mockWarehouse, name: 'Updated WH' });

      const result = await controller.update('wh-1', dto);

      expect(result.name).toBe('Updated WH');
    });
  });

  describe('toggleActive', () => {
    it('should toggle isActive', async () => {
      warehouseRepository.findOne.mockResolvedValue({ ...mockWarehouse, isActive: true } as Warehouse);
      warehouseRepository.save.mockResolvedValue({ ...mockWarehouse, isActive: false });

      const result = await controller.toggleActive('wh-1');

      expect(result.isActive).toBe(false);
    });
  });
});
