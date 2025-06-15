import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  Patch,
  Param,
  Get,
  Delete,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { Roles } from 'src/user/Guards/roles.decorator';
import { UsersGuard } from 'src/user/Guards/users.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageDto } from './dto/imageDto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { DoctorImageResult } from './dto/doctor-image-result.dto';

@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  @Roles(['doctor'])
  @UseGuards(UsersGuard)
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() imageDto: ImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    try {
      const doctorId = req.user.id;
      const secureUrl = await this.cloudinaryService.uploadFile(file);
      const newImage = await this.galleryService.uploadImage(
        imageDto.description,
        secureUrl,
        doctorId,
      );
      return { image: newImage };
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload image');
    }
  }
  @Roles(['doctor'])
  @UseGuards(UsersGuard)
  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateDoctorGallery(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() imageDto: ImageDto,
    @Param('id') id: number,
  ) {
    let image_url: string | undefined;
    if (file) {
      image_url = await this.cloudinaryService.uploadFile(file);
    }
    return await this.galleryService.updateDoctorGallery(
      id,
      image_url,
      imageDto.description,
      req.user.id,
    );
  }
  @Roles(['doctor', 'user'])
  @UseGuards(UsersGuard)
  @Get('get/:doctorId')
  async getDoctorImages(
    @Param('doctorId') doctorId: number,
  ): Promise<DoctorImageResult[]> {
    const images = await this.galleryService.getDoctorImages(doctorId);
    return images;
  }
  @Roles(['doctor'])
  @UseGuards(UsersGuard)
  @Delete('delete/:id')
  async deleteDoctorGallery(@Req() req, @Param('id') id: number) {
    return await this.galleryService.deleteDoctorGallery(id, req.user.id);
  }
}
