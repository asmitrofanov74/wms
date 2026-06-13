import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { User } from '../../domain/auth/user.entity';
import { Role } from '../../domain/auth/role.entity';
import { UserRepository } from '../../infrastructure/persistence/repositories/user.repository.impl';
import { PasswordService } from '../../infrastructure/auth/password.service';
import { USER_REPOSITORY } from '../common/constants/di-tokens';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UsersController],
  providers: [
    PasswordService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class UsersModule {}
