import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
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
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('seed.adminEmail');
    const displayName = this.config.get<string>('seed.adminName');

    const existing = await this.users.findByEmail(email);
    if (existing) {
      this.logger.log(`Admin user already exists (${email}); skipping seed.`);
      return;
    }

    await this.users.create({
      email,
      displayName,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    this.logger.log(`Seeded initial admin user: ${email}`);
  }
}
