import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '../user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Always stored/queried lowercase (normalized in UsersService) so the
  // unique constraint also behaves case-insensitively.
  @Column({ unique: true })
  email: string;

  @Column({ default: UserRole.MEMBER })
  role: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_INVITE })
  status: UserStatus;

  // Entra directory object id (Graph user.id)
  @Column({ name: 'entra_object_id', nullable: true })
  entraObjectId: string;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ name: 'invitation_token', type: 'text', nullable: true })
  invitationToken: string;

  @Column({ name: 'invitation_expires_at', type: 'timestamptz', nullable: true })
  invitationExpiresAt: Date;

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
