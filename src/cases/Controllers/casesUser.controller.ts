import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  Delete,
  Get,
} from '@nestjs/common';
import { ConditionSelectionArrayDto } from 'src/cases/dto/conditionSelectionDto';
import { UsersGuard } from 'src/user/Guards/users.guard';
import { Roles } from 'src/user/Guards/roles.decorator';
import { CasesUserService } from '../Services/casesUser.service';

@Controller('cases/user')
export class CasesUserController {
  constructor(private readonly casesUserService: CasesUserService) {}

  @UseGuards(UsersGuard)
  @Roles(['user'])
  @Post('chooseCondition')
  async chooseUserCondition(
    @Body() conditionSelectionArrayUserDto: ConditionSelectionArrayDto,
    @Request() req: any,
  ) {
    const userSessionDTO = await this.casesUserService.saveUserChoices(
      conditionSelectionArrayUserDto.selections,
      req.user.id,
    );
    return userSessionDTO;
  }

  @UseGuards(UsersGuard)
  @Roles(['user'])
  @Get('findDoctorsInSameGovernorate')
  async findDoctorsInSameGovernorate(@Request() req) {
    try {
      const doctors =
        await this.casesUserService.findMatchingDoctorsInSameGobernorate(
          req.user.id,
        );
      return {
        status: 'success',
        data: doctors,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
  @UseGuards(UsersGuard)
  @Roles(['user'])
  @Get('findDoctorsInOtherGovernorate')
  async findDoctorsInOtherGovernorate(
    @Request() req,
    @Body('selectedGovernorate') selectedGovernorate: string,
  ) {
    try {
      const doctors =
        await this.casesUserService.findMatchingDoctorsInOtherGovernorate(
          req.user.id,
          selectedGovernorate,
        );
      return {
        status: 'success',
        data: doctors,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  @UseGuards(UsersGuard)
  @Roles(['user'])
  @Delete('deleteConditions')
  async deleteUserConditions(@Request() req: any): Promise<any> {
    const userId = req.user.id;
    const userSeesion = await this.casesUserService.getUserSessionId(userId);
    if (!userSeesion) {
      throw new NotFoundException('جلسة الطبيب غير موجودة.');
    }
    await this.casesUserService.deleteUserSession(userSeesion.id);
    return {
      message:
        'The user session and related cases have been successfully deleted ',
    };
  }
}
