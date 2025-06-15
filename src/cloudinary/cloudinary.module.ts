import { forwardRef, Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';
import { DoctorService } from 'src/user/Services/Doctor/doctor.service';
import { UserService } from 'src/user/Services/User/user.service';
import { UsersModule } from 'src/user/Module/users.module';

@Module({
  imports: [CloudinaryModule, forwardRef(() => UsersModule)],
  providers: [
    CloudinaryProvider,
    CloudinaryService,
    DoctorService,
    UserService,
  ],
  exports: [CloudinaryProvider, CloudinaryService],
  controllers: [CloudinaryController],
})
export class CloudinaryModule {}
