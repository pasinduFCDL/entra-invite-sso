import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signin')
  @HttpCode(200)
  signIn(@Body() dto: SignInDto) {
    return this.auth.signIn(dto);
  }
}
