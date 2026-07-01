import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

/**
 * Validates the inbound Entra access token (token #1, audience = our API).
 *
 * - Verifies the RS256 signature against the tenant JWKS endpoint.
 * - Verifies issuer and audience.
 * - Verifies the delegated scope `access_as_user` is present.
 *
 * On success, attaches the decoded claims to `req.user` and the raw bearer
 * string to `req.azureToken` (needed later for the OBO exchange).
 */
@Injectable()
export class AzureJwtGuard implements CanActivate {
  private readonly logger = new Logger(AzureJwtGuard.name);
  private readonly jwks: JwksClient;
  private readonly tenantId: string;
  private readonly clientId: string;

  constructor(private readonly config: ConfigService) {
    this.tenantId = this.config.get<string>('azure.tenantId');
    this.clientId = this.config.get<string>('azure.clientId');
    this.jwks = new JwksClient({
      jwksUri: `https://login.microsoftonline.com/${this.tenantId}/discovery/v2.0/keys`,
      cache: true,
      cacheMaxAge: 24 * 60 * 60 * 1000,
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: jwt.JwtPayload;
    try {
      payload = await this.verify(token);
    } catch (err) {
      this.logger.warn(`Token validation failed: ${err.message}`);
      throw new UnauthorizedException('Invalid token');
    }

    // Delegated scope check (v2 tokens use `scp`)
    const scopes = (payload.scp || '').toString().split(' ');
    if (!scopes.includes('access_as_user')) {
      throw new UnauthorizedException('Missing required scope');
    }

    req.user = payload;
    req.azureToken = token;
    return true;
  }

  private verify(token: string): Promise<jwt.JwtPayload> {
    const acceptedAudiences: [string, ...string[]] = [
      this.clientId,
      `api://${this.clientId}`,
    ];
    const acceptedIssuers: [string, ...string[]] = [
      `https://login.microsoftonline.com/${this.tenantId}/v2.0`,
      `https://sts.windows.net/${this.tenantId}/`,
    ];

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (jwtHeader, callback) => {
          this.jwks
            .getSigningKey(jwtHeader.kid)
            .then((key) => callback(null, key.getPublicKey()))
            .catch((e) => callback(e));
        },
        {
          algorithms: ['RS256'],
          audience: acceptedAudiences,
          issuer: acceptedIssuers,
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as jwt.JwtPayload);
        },
      );
    });
  }
}
