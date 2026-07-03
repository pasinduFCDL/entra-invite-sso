import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppJwtService, AppTokenPayload } from './app-jwt.service';

/**
 * Validates our own app session JWT (the `auth_token` minted by AppJwtService
 * at sign-in / accept-invite). Use this to protect any endpoint that requires
 * a signed-in application user.
 *
 * On success, attaches the decoded payload to `req.appUser`.
 */
@Injectable()
export class AppJwtGuard implements CanActivate {
  constructor(private readonly appJwt: AppJwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: AppTokenPayload;
    try {
      payload = this.appJwt.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    req.appUser = payload;
    return true;
  }
}
