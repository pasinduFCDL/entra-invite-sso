import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../users/user-status.enum';
import { GraphService } from '../graph/graph.service';
import { InviteTokenService } from './invite-token.service';
import { AppJwtService } from '../auth/app-jwt.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { OboService } from 'src/graph/obo.service';

export interface InviteResult {
  code: 'INVITE_CREATED' | 'INVITE_RENEWED';
  userId: string;
  email: string;
  role: string;
  invitationUrl: string;
}

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
  };
}

interface InviteClaims {
  email: string;
  role: string;
  purpose: string;
}

@Injectable()
export class InvitesService {
  private readonly targetDomain: string;
  private readonly inviteSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly graph: GraphService,
    private readonly inviteToken: InviteTokenService,
    private readonly obo: OboService,
    private readonly appJwt: AppJwtService,
  ) {
    this.targetDomain = this.config.get<string>('azure.targetInviteDomain');
    this.inviteSecret = this.config.get<string>('invite.jwtSecret');
  }

  async invite(
    dto: CreateInviteDto,
    adminGraphToken: string,
    adminUserId: string,
  ): Promise<InviteResult> {
    const upn = `${dto.username}@${this.targetDomain}`;

    const entraUser = await this.graph.findUserByUpn(adminGraphToken, upn);
    if (!entraUser) {
      throw new NotFoundException({
        code: 'USER_NOT_IN_DIRECTORY',
        message: "No matching user in the organization's directory.",
      });
    }

    const email = (entraUser.mail || entraUser.userPrincipalName || upn).toLowerCase();

    const existing = await this.usersService.findByEmail(email);

    if (existing?.status === UserStatus.ACTIVE) {
      throw new ConflictException({
        code: 'ALREADY_REGISTERED',
        message: 'User is already registered.',
      });
    }

    const { token, url } = this.inviteToken.create({ email, role: dto.role });

    const commonFields = {
      role: dto.role,
      status: UserStatus.PENDING_INVITE,
      entraObjectId: entraUser.id,
      displayName: entraUser.displayName,
      invitationToken: token,
      invitationUrl: url,
      invitedBy: adminUserId,
      invitedAt: new Date(),
    };

    // 4a. Renew an existing pending invite.
    if (existing?.status === UserStatus.PENDING_INVITE) {
      const updated = await this.usersService.update(existing.id, commonFields);
      return {
        code: 'INVITE_RENEWED',
        userId: updated.id,
        email: updated.email,
        role: updated.role,
        invitationUrl: url,
      };
    }

    // 4b. Create a new pending invite.
    const created = await this.usersService.create({ email, ...commonFields });
    return {
      code: 'INVITE_CREATED',
      userId: created.id,
      email: created.email,
      role: created.role,
      invitationUrl: url,
    };
  }

  async devInvite(dto: CreateInviteDto): Promise<InviteResult> {
    if (!this.config.get<boolean>("dev.enabled")) {
      throw new ForbiddenException("Dev invite endpoint is disabled");
    }

    const username = this.config.get<string>("dev.adminUsername");
    const password = this.config.get<string>("dev.adminPassword");
    if (!username || !password) {
      throw new ForbiddenException("DEV_ADMIN_USERNAME / DEV_ADMIN_PASSWORD not configured");
    }

    const graphToken = await this.obo.getGraphTokenByPassword(username, password);

    const admin = await this.usersService.findByEmail(username);

    return this.invite(dto, graphToken, admin?.id);
  }

  async accept(dto: AcceptInviteDto): Promise<AuthResult> {
    let claims: InviteClaims;
    try {
      claims = jwt.verify(dto.invitationToken, this.inviteSecret) as InviteClaims;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: 'EXPIRED_INVITATION_TOKEN',
          message: 'This invitation link has expired.',
        });
      }
      throw new UnauthorizedException({
        code: 'INVALID_INVITATION_TOKEN',
        message: 'The invitation link is invalid.',
      });
    }

    if (claims.purpose !== 'invite') {
      throw new UnauthorizedException({
        code: 'INVALID_INVITATION_TOKEN',
        message: 'The invitation link is invalid.',
      });
    }

    const invitedEmail = claims.email.toLowerCase();

    let entraUser: Awaited<ReturnType<GraphService['getMe']>>;
    try {
      entraUser = await this.graph.getMe(dto.entraToken);
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_ENTRA_TOKEN',
        message: 'Microsoft authentication failed. Please sign in again.',
      });
    }

    if (!entraUser) {
      throw new UnauthorizedException({
        code: 'USER_NOT_IN_DIRECTORY',
        message: 'Your account was not found in the organization directory.',
      });
    }

    const entraEmail = (entraUser.mail || entraUser.userPrincipalName || '').toLowerCase();
    if (entraEmail !== invitedEmail) {
      throw new ForbiddenException({
        code: 'EMAIL_MISMATCH',
        message: `You signed in as ${entraEmail} but the invitation was sent to ${invitedEmail}. Please sign in with the correct account.`,
      });
    }

    const user = await this.usersService.findByEmail(invitedEmail);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'No invitation record was found for this email.',
      });
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException({
        code: 'INVITE_ALREADY_USED',
        message: 'This invitation has already been accepted. Please sign in.',
      });
    }

    if (user.invitationToken !== dto.invitationToken) {
      throw new ForbiddenException({
        code: 'TOKEN_MISMATCH',
        message: 'This invitation link is no longer valid.',
      });
    }

    await this.usersService.update(user.id, {
      status: UserStatus.ACTIVE,
      entraObjectId: entraUser.id,
      displayName: entraUser.displayName,
      invitationToken: null,
      invitationUrl: null,
    });

    const accessToken = this.appJwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: entraUser.displayName || user.displayName,
      },
    };
  }
}
