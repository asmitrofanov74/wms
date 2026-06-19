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
  Inject,
  UseGuards,
  NotFoundException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { IUserRepository } from '../../domain/auth/user.repository.interface';
import { User } from '../../domain/auth/user.entity';
import { Role } from '../../domain/auth/role.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { PasswordService } from '../../infrastructure/auth/password.service';
import { USER_REPOSITORY } from '../common/constants/di-tokens';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  @Get()
  @Roles('Admin')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<{ data: UserResponseDto[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } }> {
    const users = await this.userRepository.findAll();
    const total = users.length;
    const totalPages = Math.ceil(total / (limit || 20));
    const skip = ((page || 1) - 1) * (limit || 20);
    const paged = users.slice(skip, skip + (limit || 20));
    return {
      data: paged.map(this.toResponseDto),
      meta: {
        total,
        page: page || 1,
        limit: limit || 20,
        totalPages,
        hasNextPage: (page || 1) < totalPages,
        hasPreviousPage: (page || 1) > 1,
      },
    };
  }

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = new User();
    user.email = dto.email;
    user.passwordHash = await this.passwordService.hash(dto.password);
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.isActive = true;
    if (dto.roleIds?.length) {
      user.roles = await this.roleRepository.find({ where: { id: In(dto.roleIds) } });
    }
    const saved = await this.userRepository.save(user);
    return this.toResponseDto(saved);
  }

  @Get(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.toResponseDto(user);
  }

  @Put(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (dto.email) user.email = dto.email;
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.roleIds) {
      user.roles = await this.roleRepository.find({ where: { id: In(dto.roleIds) } });
    }
    const saved = await this.userRepository.save(user);
    return this.toResponseDto(saved);
  }

  @Patch(':id/activate')
  @Roles('Admin')
  @ApiOperation({ summary: 'Toggle user active status' })
  async toggleActive(@Param('id') id: string): Promise<UserResponseDto> {
    const user = (await this.userRepository.findById(id)) as User;
    user.isActive = !user.isActive;
    const saved = await this.userRepository.save(user);
    return this.toResponseDto(saved);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a user' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.roles?.map((r) => r.name) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
