import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesController } from './categories.controller';
import { Category } from '../../domain/product/category.entity';
import { CategoryDto } from './dto/product.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoryRepository: jest.Mocked<Repository<Category>>;

  const mockParent: Category = {
    id: 'cat-1', code: 'ELEC', name: 'Electronics', path: 'ELEC', isActive: true,
    children: [], parent: null as any,
    createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'),
  };

  const mockChild: Category = {
    id: 'cat-2', code: 'PHONE', name: 'Phones', path: 'ELEC.PHONE', isActive: true,
    children: [], parent: mockParent,
    createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  describe('findAll', () => {
    it('should return root categories with children as tree', async () => {
      categoryRepository.find.mockResolvedValue([mockParent, mockChild]);
      const result = await controller.findAll();
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('ELEC');
    });

    it('should return empty array when no categories', async () => {
      categoryRepository.find.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result.length).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto: CategoryDto = { code: 'NEW', name: 'New Category' };
      categoryRepository.save.mockResolvedValue({ ...mockParent, id: 'cat-new', code: 'NEW', name: 'New Category' });

      const result = await controller.create(dto);

      expect(result.code).toBe('NEW');
    });

    it('should create a category with parent', async () => {
      const dto: CategoryDto = { code: 'SUB', name: 'Sub Category', parentId: 'cat-1' };
      categoryRepository.save.mockResolvedValue({ ...mockChild, id: 'cat-sub', code: 'SUB', name: 'Sub Category', parent: { id: 'cat-1' } as Category });

      const result = await controller.create(dto);

      expect(result.code).toBe('SUB');
    });
  });

  describe('findOne', () => {
    it('should return category with children', async () => {
      categoryRepository.findOne.mockResolvedValue(mockParent);
      const result = await controller.findOne('cat-1');
      expect(result.code).toBe('ELEC');
    });

    it('should throw NotFoundException when not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);
      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update category fields', async () => {
      const dto: CategoryDto = { code: 'UPD', name: 'Updated' };
      categoryRepository.findOne.mockResolvedValue(mockParent);
      categoryRepository.save.mockResolvedValue({ ...mockParent, code: 'UPD', name: 'Updated' });

      const result = await controller.update('cat-1', dto);

      expect(result.code).toBe('UPD');
    });
  });

  describe('remove', () => {
    it('should delete category without children', async () => {
      categoryRepository.findOne.mockResolvedValue({ ...mockParent, children: [] });
      await controller.remove('cat-1');
      expect(categoryRepository.delete).toHaveBeenCalledWith('cat-1');
    });

    it('should throw BadRequestException when category has children', async () => {
      categoryRepository.findOne.mockResolvedValue({ ...mockParent, children: [mockChild] });
      await expect(controller.remove('cat-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);
      await expect(controller.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
