import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface InviteTokenResult {
  token: string;
  expiresAt: Date;
  url: string;
}

/**
 * Mints our own invitation JWT (NOT an Entra token), 3-day expiry by default,
 * and builds the invite URL. The token carries minimal claims plus
 * `purpose: 'invite'` so it cannot be repurposed as a session token.
 */
@Injectable()
export class InviteTokenService {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly appBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.secret = this.config.get<string>('invite.jwtSecret');
    this.expiresIn = this.config.get<string>('invite.jwtExpires');
    this.appBaseUrl = this.config.get<string>('invite.appBaseUrl');
  }

  create(params: { email: string; role: string }): InviteTokenResult {
    const token = jwt.sign(
      { email: params.email, role: params.role, purpose: 'invite' },
      this.secret,
      { expiresIn: this.expiresIn } as jwt.SignOptions,
    );

    const decoded = jwt.decode(token) as jwt.JwtPayload;
    const expiresAt = new Date(decoded.exp * 1000);
    const url = `${this.appBaseUrl}/accept-invite?token=${encodeURIComponent(token)}`;

    return { token, expiresAt, url };
  }
}
