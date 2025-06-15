import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorImage } from 'src/entities/doctorImage.entity';
import { Repository } from 'typeorm';
import { DoctorImageResult } from './dto/doctor-image-result.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(DoctorImage)
    private readonly doctorImageRepository: Repository<DoctorImage>,
  ) {}
  async uploadImage(description: string, imageUrl: string, doctorId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    
    const newImage = new DoctorImage();
    newImage.description = description;
    newImage.image_url = imageUrl;
    newImage.doctorId = doctorId;
    await this.doctorImageRepository.save(newImage, { reload: true });

    return newImage;
  }
  async updateDoctorGallery(
    imageId: number,
    image_url: string | undefined,
    description: string | undefined,
    doctorId: number,
  ) {
    const image = await this.doctorImageRepository.findOne({
      where: { image_id: imageId, doctorId },
    });
    if (!image) {
      throw new NotFoundException(
        'Image not found or not owned by this doctor',
      );
    }
    if (image_url) {
      image.image_url = image_url;
    }
    if (description) {
      image.description = description;
    }
    await this.doctorImageRepository.save(image);
    return image;
  }
  async getDoctorImages(doctorId: number): Promise<DoctorImageResult[]> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('not found doctor');
    }
    const images = await this.doctorImageRepository.find({
      where: { doctorId },
    });
    return images.map((image) => ({
      image_url: image.image_url,
      description: image.description,
    }));
  }
   async deleteDoctorGallery(imageId: number, doctorId: number) {
    const image = await this.doctorImageRepository.findOne({
      where: { image_id: imageId, doctorId },
    });
    if (!image) {
      throw new NotFoundException(
        'Image not found or not owned by this doctor',
      );
    }
    await this.doctorImageRepository.delete(imageId);
    return { message: 'image deleted successfully' };
  }
}
