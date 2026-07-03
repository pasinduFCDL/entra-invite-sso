import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserStatus } from '../user-status.enum';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Always stored/queried lowercase (normalized in UsersService) so the
  @Column({ unique: true })
  email: string;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string;

  // Eager-loaded so read paths can rely on `user.role.name` without an
  // explicit join. Each user has exactly one role.
  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_INVITE })
  status: UserStatus;

  // Entra directory object id (Graph user.id)
  @Column({ name: 'entra_object_id', nullable: true })
  entraObjectId: string;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ name: 'invitation_token', type: 'text', nullable: true })
  invitationToken: string;

  @Column({ name: 'invitation_url', type: 'text', nullable: true })
  invitationUrl: string;

  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy: string;

  @Column({ name: 'invited_at', type: 'timestamptz', nullable: true })
  invitedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
