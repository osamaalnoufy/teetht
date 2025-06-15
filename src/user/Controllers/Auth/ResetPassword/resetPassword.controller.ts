import { Body, Controller, Put } from '@nestjs/common';
import { ResetPasswordDto } from 'src/user/Dtos/Auth/ResetPassword/resetPasswordDto.dto';
import { ResetPasswordService } from 'src/user/Services/Auth/ResetPassword/resetPassword.service';

@Controller('reset-password')
export class ResetPassword {
  constructor(private resetPasswordService: ResetPasswordService) {}
  @Put('doctor')
  async resetPasswordDoctor(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.resetPasswordService.resetPasswordDoctor(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken,
    );
  }
}
