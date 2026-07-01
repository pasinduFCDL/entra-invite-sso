import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: this.normalize(email) } });
  }

  create(data: Partial<User>): Promise<User> {
    const entity = this.repo.create({
      ...data,
      email: this.normalize(data.email),
    });
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    if (data.email) data.email = this.normalize(data.email);
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
