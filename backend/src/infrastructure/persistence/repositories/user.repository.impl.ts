import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/auth/user.entity';
import { IUserRepository } from '../../../domain/auth/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly ormRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.ormRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.ormRepo.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
      select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.ormRepo.find({
      relations: ['roles'],
    });
  }

  async save(user: User): Promise<User> {
    return this.ormRepo.save(user);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }
}
