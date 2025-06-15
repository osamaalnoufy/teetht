import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  CreateDoctorDto,
  CreateUserDto,
  VerifyTheEmailDto,
} from 'src/user/Dtos/Auth/authDto.dto';
import { AuthService } from 'src/user/Services/Auth/auth.service';
import { LocalUserAuthGuard } from 'src/user/Guards/localuser-auth.guard';
import { LocalDoctorAuthGuard } from 'src/user/Guards/localdoctor-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('doctor/sign-up')
  async createDoctor(@Body() createDoctorDto: CreateDoctorDto) {
    return await this.authService.createDoctor(createDoctorDto);
  }

  @UseGuards(LocalDoctorAuthGuard)
  @Post('doctor/login')
  async loginDoctor(@Request() req: any) {
    return this.authService.loginDoctor(req.doctor);
  }

  @Post('user/sign-up')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.authService.createUser(createUserDto);
  }

  @UseGuards(LocalUserAuthGuard)
  @Post('user/login')
  async loginUesr(@Request() req: any) {
    return this.authService.loginUesr(req.user);
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: { refresh_token: string }) {
    return await this.authService.refreshToken(body.refresh_token);
  }

  @Post('doctor/verify-the-email')
  async verifyTheEmail(@Body() verifyTheEmailDto: VerifyTheEmailDto) {
    return this.authService.verifyTheEmail(verifyTheEmailDto.token);
  }
}
