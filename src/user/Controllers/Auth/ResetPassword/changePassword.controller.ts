import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import { ChangePasswordDto } from 'src/user/Dtos/Auth/ResetPassword/changePasswordDto.dto';
import { Roles } from 'src/user/Guards/roles.decorator';
import { UsersGuard } from 'src/user/Guards/users.guard';
import { ChangePasswordService } from 'src/user/Services/Auth/ResetPassword/changePassword.service';

@Controller()
export class ChangePassword {
  constructor(private changePasswordService: ChangePasswordService) {}
  @Roles(['doctor', 'user'])
  @UseGuards(UsersGuard)
  @Put('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ) {
    const { role, id } = req.user;
    if (role === 'doctor') {
      return await this.changePasswordService.changePasswordDoctor(
        id,
        changePasswordDto.oldPassword,
        changePasswordDto.newPassword,
      );
    } else if (role === 'user') {
      return await this.changePasswordService.changePasswordUser(
        id,
        changePasswordDto.oldPassword,
        changePasswordDto.newPassword,
      );
    }
  }
  @Roles(['doctor'])
  @UseGuards(UsersGuard)
  @Put('add-password')
  async addPassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ) {
    return await this.changePasswordService.addPassword(
      req.user.id,
      changePasswordDto.newPassword,
    );
  }
}
