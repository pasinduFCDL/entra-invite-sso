import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../users/user-status.enum';
import { GraphService } from '../graph/graph.service';
import { AppJwtService } from './app-jwt.service';
import { SignInDto } from './dto/sign-in.dto';

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly graph: GraphService,
    private readonly appJwt: AppJwtService,
  ) {}

  async signIn(dto: SignInDto): Promise<AuthResult> {
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

    const email = (entraUser.mail || entraUser.userPrincipalName || '').toLowerCase();

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'No account was found for this email.',
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Your invitation has not been accepted yet.',
      });
    }

    const accessToken = this.appJwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role?.name,
      displayName: user.displayName,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role?.name,
        displayName: entraUser.displayName || user.displayName,
      },
    };
  }
}
