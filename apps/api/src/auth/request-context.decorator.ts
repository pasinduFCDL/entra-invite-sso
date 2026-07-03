import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { AppTokenPayload } from './app-jwt.service';

/** Raw Entra access token (token #1), used for the OBO exchange. */
export const AzureToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().azureToken;
  },
);

/** The resolved local Admin user (set by AdminGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    return ctx.switchToHttp().getRequest().localUser;
  },
);

/** The app session JWT payload (set by AppJwtGuard). */
export const AppUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppTokenPayload => {
    return ctx.switchToHttp().getRequest().appUser;
  },
);
