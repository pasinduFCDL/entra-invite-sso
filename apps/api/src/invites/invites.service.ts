import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../users/user-status.enum';
import { GraphService } from '../graph/graph.service';
import { InviteTokenService } from './invite-token.service';
import { CreateInviteDto } from './dto/create-invite.dto';

export interface InviteResult {
  code: 'INVITE_CREATED' | 'INVITE_RENEWED';
  userId: string;
  email: string;
  role: string;
  invitationUrl: string;
  expiresAt: Date;
}

@Injectable()
export class InvitesService {
  private readonly targetDomain: string;

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly graph: GraphService,
    private readonly inviteToken: InviteTokenService,
  ) {
    this.targetDomain = this.config.get<string>('azure.targetInviteDomain');
  }

  async invite(
    dto: CreateInviteDto,
    adminGraphToken: string,
    adminUserId: string,
  ): Promise<InviteResult> {
    // Option A: reconstruct the UPN from the username + configured domain.
    const upn = `${dto.username}@${this.targetDomain}`;

    // 1. Verify the user exists in the partner directory via Graph.
    const entraUser = await this.graph.findUserByUpn(adminGraphToken, upn);
    if (!entraUser) {
      throw new NotFoundException({
        code: 'USER_NOT_IN_DIRECTORY',
        message: "No matching user in the organization's directory.",
      });
    }

    // Prefer the directory's authoritative mail; fall back to the UPN.
    const email = (entraUser.mail || entraUser.userPrincipalName || upn).toLowerCase();

    // 2. Local lookup + state machine.
    const existing = await this.users.findByEmail(email);

    if (existing?.status === UserStatus.ACTIVE) {
      throw new ConflictException({
        code: 'ALREADY_REGISTERED',
        message: 'User is already registered.',
      });
    }

    // 3. Mint invitation token + URL.
    const { token, expiresAt, url } = this.inviteToken.create({ email, role: dto.role });

    const commonFields = {
      role: dto.role,
      status: UserStatus.PENDING_INVITE,
      entraObjectId: entraUser.id,
      displayName: entraUser.displayName,
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      invitationUrl: url,
      invitedBy: adminUserId,
      invitedAt: new Date(),
    };

    // 4a. Renew an existing pending invite.
    if (existing?.status === UserStatus.PENDING_INVITE) {
      const updated = await this.users.update(existing.id, commonFields);
      return {
        code: 'INVITE_RENEWED',
        userId: updated.id,
        email: updated.email,
        role: updated.role,
        invitationUrl: url,
        expiresAt,
      };
    }

    // 4b. Create a new pending invite.
    const created = await this.users.create({ email, ...commonFields });
    return {
      code: 'INVITE_CREATED',
      userId: created.id,
      email: created.email,
      role: created.role,
      invitationUrl: url,
      expiresAt,
    };
  }
}
