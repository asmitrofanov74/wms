import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../../domain/auth/user.entity';
import { Role } from '../../../domain/auth/role.entity';
import { Permission } from '../../../domain/auth/permission.entity';
import { PasswordService } from '../../auth/password.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  private async seed(): Promise<void> {
    const roleRepo = this.dataSource.getRepository(Role);
    const existingRoles = await roleRepo.count();
    if (existingRoles > 0) {
      this.logger.log('Database already seeded, skipping.');
      return;
    }

    this.logger.log('Seeding database...');
    const permissions = await this.seedPermissions();
    const roles = await this.seedRoles(permissions);
    await this.seedUsers(roles);
    this.logger.log('Database seeding complete.');
  }

  private async seedPermissions(): Promise<Permission[]> {
    const repo = this.dataSource.getRepository(Permission);
    const resources = ['users', 'roles', 'warehouses', 'zones', 'locations', 'products', 'categories', 'inventory', 'audit', 'reports'];
    const actions = ['create', 'read', 'update', 'delete'];
    const permissions: Permission[] = [];
    for (const resource of resources) {
      for (const action of actions) {
        const permission = new Permission();
        permission.resource = resource;
        permission.action = action;
        permission.description = `Can ${action} ${resource}`;
        permissions.push(permission);
      }
    }
    return repo.save(permissions);
  }

  private async seedRoles(permissions: Permission[]): Promise<Role[]> {
    const repo = this.dataSource.getRepository(Role);

    const adminRole = new Role();
    adminRole.name = 'Admin';
    adminRole.description = 'System administrator with full access';
    adminRole.isSystem = true;
    adminRole.permissions = permissions;
    await repo.save(adminRole);

    const managerRole = new Role();
    managerRole.name = 'Manager';
    managerRole.description = 'Warehouse manager';
    managerRole.isSystem = true;
    managerRole.permissions = permissions.filter(
      (p) => !['delete'].includes(p.action) || p.resource === 'inventory',
    );
    await repo.save(managerRole);

    const operatorRole = new Role();
    operatorRole.name = 'Operator';
    operatorRole.description = 'Warehouse operator';
    operatorRole.isSystem = true;
    operatorRole.permissions = permissions.filter(
      (p) =>
        ['read'].includes(p.action) ||
        (['update', 'create'].includes(p.action) &&
          ['inventory', 'locations'].includes(p.resource)),
    );
    await repo.save(operatorRole);

    return [adminRole, managerRole, operatorRole];
  }

  private async seedUsers(roles: Role[]): Promise<void> {
    const repo = this.dataSource.getRepository(User);

    const adminUser = new User();
    adminUser.email = 'admin@wms.com';
    adminUser.passwordHash = await this.passwordService.hash('admin123');
    adminUser.firstName = 'Admin';
    adminUser.lastName = 'User';
    adminUser.isActive = true;
    adminUser.roles = [roles.find((r) => r.name === 'Admin')!];
    await repo.save(adminUser);

    const managerUser = new User();
    managerUser.email = 'manager@wms.com';
    managerUser.passwordHash = await this.passwordService.hash('manager123');
    managerUser.firstName = 'Manager';
    managerUser.lastName = 'User';
    managerUser.isActive = true;
    managerUser.roles = [roles.find((r) => r.name === 'Manager')!];
    await repo.save(managerUser);

    const operatorUser = new User();
    operatorUser.email = 'operator@wms.com';
    operatorUser.passwordHash = await this.passwordService.hash('operator123');
    operatorUser.firstName = 'Operator';
    operatorUser.lastName = 'User';
    operatorUser.isActive = true;
    operatorUser.roles = [roles.find((r) => r.name === 'Operator')!];
    await repo.save(operatorUser);

    this.logger.log('Created seed users: admin@wms.com, manager@wms.com, operator@wms.com');
  }
}
