import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AppTokenPayload {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class AppJwtService {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: AppTokenPayload): string {
    return this.jwt.sign(payload);
  }

  verify(token: string): AppTokenPayload {
    return this.jwt.verify<AppTokenPayload>(token);
  }
}
