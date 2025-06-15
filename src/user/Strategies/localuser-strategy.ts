import { PassportStrategy } from '@nestjs/passport';

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Strategy } from 'passport-local';
import { AuthService } from '../Services/Auth/auth.service';

@Injectable()
export class LocalUserStrategy extends PassportStrategy(
  Strategy,
  'local-user',
) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'phone',
    });
  }

  async validate(phone: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(phone, password);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
