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
import { Role } from '../../domain/auth/role.entity';
import { Permission } from '../../domain/auth/permission.entity';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto/role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  @Get('permissions')
  @Roles('Admin')
  @ApiOperation({ summary: 'List all permissions' })
  async listPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({ order: { resource: 'ASC', action: 'ASC' } });
  }

  @Get()
  @Roles('Admin')
  @ApiOperation({ summary: 'List all roles' })
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.find({ relations: ['permissions'] });
    return roles.map(this.toResponseDto);
  }

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new role' })
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('Role name already exists');
    }

    const role = new Role();
    role.name = dto.name;
    role.description = dto.description || '';
    role.isSystem = false;

    if (dto.permissionIds?.length) {
      role.permissions = await this.permissionRepository.findByIds(
        dto.permissionIds,
      );
    }

    const saved = await this.roleRepository.save(role);
    return this.toResponseDto(saved);
  }

  @Get(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Get role with permissions' })
  async findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return this.toResponseDto(role);
  }

  @Put(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update role' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('Cannot modify system role');

    if (dto.name) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;

    const saved = await this.roleRepository.save(role);
    return this.toResponseDto(saved);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a role (non-system)' })
  async remove(@Param('id') id: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('Cannot delete system role');
    await this.roleRepository.delete(id);
  }

  @Get(':id/permissions')
  @Roles('Admin')
  @ApiOperation({ summary: 'Get permissions for role' })
  async getPermissions(@Param('id') id: string): Promise<string[]> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role.permissions.map((p) => `${p.resource}:${p.action}`);
  }

  @Put(':id/permissions')
  @Roles('Admin')
  @ApiOperation({ summary: 'Assign permissions to role' })
  async setPermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
  ): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    role.permissions = await this.permissionRepository.findByIds(
      body.permissionIds,
    );
    await this.roleRepository.save(role);
  }

  private toResponseDto(role: Role): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions?.map((p) => `${p.resource}:${p.action}`) || [],
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
