import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UpdateDoctorDto } from 'src/user/Dtos/Doctor/updateDoctorDto.dto';
import { UpdateUserDto } from 'src/user/Dtos/User/updateuserDto.dto';
import { Roles } from 'src/user/Guards/roles.decorator';
import { UsersGuard } from 'src/user/Guards/users.guard';
import { DoctorService } from 'src/user/Services/Doctor/doctor.service';
import { UserService } from 'src/user/Services/User/user.service';

@Controller('crud')
export class CrudController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private doctorService: DoctorService,
    private userService: UserService,
  ) {}

  @Roles(['doctor', 'user'])
  @UseGuards(UsersGuard)
  @Patch('update')
  updateDoctor(
    @Req() req,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const { role, id } = req.user;
    if (role === 'doctor') {
      return this.doctorService.updateDoctor(id, updateDoctorDto);
    } else if (role === 'user') {
      return this.userService.updateUser(id, updateUserDto);
    }
  }

  @Roles(['doctor', 'user'])
  @UseGuards(UsersGuard)
  @Get('profiel')
  async getMyProfiel(@Req() req): Promise<any> {
    const { role, id } = req.user;
    if (role === 'user') {
      const profiel = await this.userService.getUserProfiel(id);
      return profiel;
    } else if (role === 'doctor') {
      const profiel = await this.doctorService.getDoctorProfiel(id);
      return profiel;
    }
  }
  @Roles(['doctor'])
  @UseGuards(UsersGuard)
  @Get('user/profiel/:id')
  async getProfielUser(@Param('id') id: number): Promise<any> {
    const profiel = await this.userService.getUserProfiel(id);
    return profiel;
  }
  @Roles(['user'])
  @UseGuards(UsersGuard)
  @Get('doctor/profiel/:id')
  async getProfielDoctor(@Param('id') id: number): Promise<any> {
    const profiel = await this.doctorService.getDoctorProfiel(id);
    return profiel;
  }

  @Roles(['doctor', 'user'])
  @UseGuards(UsersGuard)
  @Delete('delete')
  async deleteUser(@Req() req): Promise<{ message: string }> {
    const { role, id } = req.user;
    if (role === 'user') {
      return this.userService.deleteUser(id);
    } else if (role === 'doctor') {
      return this.doctorService.deleteDoctor(id);
    }
  }
}
