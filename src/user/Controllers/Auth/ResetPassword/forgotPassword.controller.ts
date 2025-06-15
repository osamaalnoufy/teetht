import { Body, Controller, Post } from '@nestjs/common';
import { ForgotPasswordDto } from 'src/user/Dtos/Auth/ResetPassword/forgotPasswordDto.dto';
import { ForgotPasswordService } from 'src/user/Services/Auth/ResetPassword/forgotPassword.service';

@Controller('forgot-password')
export class ForgotPassword {
  constructor(private forgotPasswordService: ForgotPasswordService) {}
  @Post('doctor')
  async forgotPasswordDoctor(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.forgotPasswordService.forgotPasswordDoctor(
      forgotPasswordDto.email,
    );
  }
}
