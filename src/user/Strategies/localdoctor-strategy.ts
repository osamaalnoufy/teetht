import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { Injectable, Request, NotFoundException } from '@nestjs/common';
import { AuthService } from '../Services/Auth/auth.service';
@Injectable()
export class LocalDoctorStrategy extends PassportStrategy(
  Strategy,
  'local-doctor',
) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passReqToCallback: true,
    });
  }
  async validate(
    @Request() req,
    email: string,
    password: string,
  ): Promise<any> {
    const doctor = await this.authService.validateDoctor(email, password);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    req.doctor = doctor;
    return doctor;
  }
}
