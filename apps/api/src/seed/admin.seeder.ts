import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RolesService } from '../users/roles.service';
import { UserRole, UserStatus } from '../users/user-status.enum';

/**
 * Seeds the initial Admin user on application boot. Creates the record only if
 * it does not already exist (idempotent), so restarts won't duplicate it.
 */
@Injectable()
export class AdminSeeder implements OnModuleInit {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly roles: RolesService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Roles must exist before any user can reference one.
    await this.roles.ensureSeeded();

    const email = this.config.get<string>('seed.adminEmail');
    const displayName = this.config.get<string>('seed.adminName');

    const existing = await this.users.findByEmail(email);
    if (existing) {
      this.logger.log(`Admin user already exists (${email}); skipping seed.`);
      return;
    }

    const adminRole = await this.roles.findOrCreate(UserRole.ADMIN);
    await this.users.create({
      email,
      displayName,
      roleId: adminRole.id,
      status: UserStatus.ACTIVE,
    });
    this.logger.log(`Seeded initial admin user: ${email}`);
  }
}
