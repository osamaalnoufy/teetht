import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  NotFoundException,
  Delete,
  Get,
} from '@nestjs/common';
import { CasesDoctorService } from '../Services/casesDoctor.service';
import { ConditionSelectionArrayDto } from '../dto/conditionSelectionDto';
import { Roles } from 'src/user/Guards/roles.decorator';
import { UsersGuard } from 'src/user/Guards/users.guard';

@Controller('cases/doctor')
export class CasesDoctorController {
  constructor(private readonly casesDoctorService: CasesDoctorService) {}
  @UseGuards(UsersGuard)
  @Roles(['doctor'])
  @Post('chooseCondition')
  async chooseDoctorCondition(
    @Body() conditionSelectionArrayDoctorDto: ConditionSelectionArrayDto,
    @Request() req,
  ) {
    const doctorSessionDTO = await this.casesDoctorService.saveDoctorChoices(
      conditionSelectionArrayDoctorDto.selections,
      req.user.id,
    );
    return doctorSessionDTO;
  }

  @UseGuards(UsersGuard)
  @Roles(['doctor'])
  @Delete('deleteConditions')
  async deleteDoctorConditions(
    @Request() req: any,
  ): Promise<{ message: string }> {
    const doctorId = req.user.id;
    const doctorSession =
      await this.casesDoctorService.getDoctorSessionId(doctorId);

    if (!doctorSession) {
      throw new NotFoundException('جلسة الطبيب غير موجودة.');
    }
    await this.casesDoctorService.deleteDoctorSession(doctorSession.id);
    return {
      message:
        'The doctor session and related cases have been successfully deleted ',
    };
  }

  @UseGuards(UsersGuard)
  @Roles(['doctor'])
  @Get('findUsersInSameGovernorate')
  async findUsersInSameGovernorate(@Request() req) {
    try {
      const users =
        await this.casesDoctorService.findMatchingUsersInSameGobernorate(
          req.user.id,
        );
      return {
        status: 'success',
        data: users,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
  @UseGuards(UsersGuard)
  @Roles(['doctor'])
  @Get('findUsersInOtherGovernorate')
  async findUsersInOtherGovernorate(
    @Request() req,
    @Body('selectedGovernorate') selectedGovernorate: string,
  ) {
    try {
      const users =
        await this.casesDoctorService.findMatchingUsersInOtherGobernorate(
          req.user.id,
          selectedGovernorate,
        );
      return {
        status: 'success',
        data: users,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
