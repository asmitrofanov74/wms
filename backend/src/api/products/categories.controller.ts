import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { Category } from '../../domain/product/category.entity';
import {
  CategoryDto,
  CategoryResponseDto,
} from './dto/product.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all categories (tree)' })
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      relations: ['children'],
    });
    const roots = categories.filter((c) => !c.parent);
    return roots.map((c) => this.buildTree(c, categories));
  }

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Create a category' })
  async create(@Body() dto: CategoryDto): Promise<CategoryResponseDto> {
    const category = new Category();
    category.code = dto.code;
    category.name = dto.name;
    if (dto.parentId) category.parent = { id: dto.parentId } as Category;
    category.isActive = true;
    const saved = await this.categoryRepository.save(category);
    return this.toResponseDto(saved);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category with children' })
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return this.toResponseDto(category);
  }

  @Put(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update category' })
  async update(
    @Param('id') id: string,
    @Body() dto: CategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    category.code = dto.code;
    category.name = dto.name;
    if (dto.parentId) category.parent = { id: dto.parentId } as Category;
    const saved = await this.categoryRepository.save(category);
    return this.toResponseDto(saved);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a category' })
  async remove(@Param('id') id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.children?.length) {
      throw new BadRequestException(
        'Cannot delete category with children. Reassign or delete children first.',
      );
    }
    await this.categoryRepository.delete(id);
  }

  private buildTree(
    node: Category,
    all: Category[],
  ): CategoryResponseDto {
    return {
      id: node.id,
      code: node.code,
      name: node.name,
      path: node.path || '',
      isActive: node.isActive,
      children: (node.children || [])
        .filter((c) => c.isActive)
        .map((child) => this.buildTree(child, all)),
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };
  }

  private toResponseDto(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      code: category.code,
      name: category.name,
      path: category.path || '',
      isActive: category.isActive,
      children: (category.children || []).map((c) => this.toResponseDto(c)),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
