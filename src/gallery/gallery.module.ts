import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorImage } from 'src/entities/doctorImage.entity';
import { UsersModule } from 'src/user/Module/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, DoctorImage]),
    GalleryModule,
    UsersModule,
  ],
  controllers: [GalleryController],
  providers: [GalleryService, CloudinaryService],
})
export class GalleryModule {}
