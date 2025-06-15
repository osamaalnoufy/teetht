import {
  Controller,
  UploadedFile,
  Request,
  UseInterceptors,
  UseGuards,
  Put,
} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { DoctorService } from 'src/user/Services/Doctor/doctor.service';
import { UserService } from 'src/user/Services/User/user.service';
import { Roles } from 'src/user/Guards/roles.decorator';
import { UsersGuard } from 'src/user/Guards/users.guard';

@Controller('upload')
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly doctorService: DoctorService,
    private readonly userService: UserService,
  ) {}
  @Roles(['doctor', 'user'])
  @UseGuards(UsersGuard)
  @Put('photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Request() req,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const { role, id } = req.user;
    if (role === 'doctor') {
      const doctorId = id;
      const secureUrl = await this.cloudinaryService.uploadFile(image);
      return await this.doctorService.uploadPhotoDoctor(secureUrl, doctorId);
    } else if (role === 'user') {
      const userId = id;
      const secureUrl = await this.cloudinaryService.uploadFile(image);
      return await this.userService.uploadPhotoUser(secureUrl, userId);
    }
  }
}
