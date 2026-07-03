import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { UserRole } from './user-status.enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}

  findByName(name: string): Promise<Role | null> {
    return this.repo.findOne({ where: { name } });
  }

  /** Returns the role row for `name`, creating it if it doesn't exist yet. */
  async findOrCreate(name: string): Promise<Role> {
    const existing = await this.repo.findOne({ where: { name } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ name }));
  }

  /**
   * Ensures a row exists for every UserRole value (idempotent). Safe to call on
   * every boot before seeding users that reference a role.
   */
  async ensureSeeded(): Promise<void> {
    for (const name of Object.values(UserRole)) {
      await this.findOrCreate(name);
    }
  }
}
