import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { Repository } from 'typeorm';

import { User } from 'src/entities/user.entity';

import { DoctorImage } from 'src/entities/doctorImage.entity';

import { UpdateDoctorDto } from 'src/user/Dtos/Doctor/updateDoctorDto.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(DoctorImage)
    private readonly doctorImageRepository: Repository<DoctorImage>,
  ) {}

  async findOne(email: string): Promise<Doctor | undefined> {
    return await this.doctorRepository.findOne({ where: { email } });
  }

  async deleteDoctor(doctorId: number): Promise<{ message: string }> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    await this.doctorRepository.delete(doctorId);
    return { message: 'doctor deleted successfully' };
  }

  async updateDoctor(
    id: number,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<Partial<Doctor>> {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    if (
      updateDoctorDto.email !== undefined &&
      updateDoctorDto.email !== doctor.email
    ) {
      const existingUserWithEmail = await this.doctorRepository.findOne({
        where: { email: updateDoctorDto.email },
      });
      if (existingUserWithEmail) {
        throw new ConflictException('email already exists');
      }
      doctor.email = updateDoctorDto.email;
    }

    if (
      updateDoctorDto.phone !== undefined &&
      updateDoctorDto.phone !== doctor.phone
    ) {
      const existingUserWithPhone =
        (await this.doctorRepository.findOne({
          where: { phone: updateDoctorDto.phone },
        })) ||
        (await this.userRepository.findOne({
          where: { phone: updateDoctorDto.phone },
        }));
      if (existingUserWithPhone) {
        throw new ConflictException('phone number already exists');
      }
      doctor.phone = updateDoctorDto.phone;
    }

    if (updateDoctorDto.name !== undefined) {
      doctor.name = updateDoctorDto.name;
    }

    if (updateDoctorDto.university !== undefined) {
      doctor.university = updateDoctorDto.university;
    }

    if (updateDoctorDto.collegeyear !== undefined) {
      doctor.collegeyear = updateDoctorDto.collegeyear;
    }

    if (updateDoctorDto.governorate !== undefined) {
      doctor.governorate = updateDoctorDto.governorate;
    }

    await this.doctorRepository.save(doctor);
    const updatedDoctor = await this.doctorRepository.findOne({
      where: { id },
      select: [
        'id',
        'name',
        'email',
        'phone',
        'governorate',
        'university',
        'collegeyear',
      ],
    });
    return updatedDoctor;
  }

  async uploadPhotoDoctor(imageUrl: string, doctorId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    const newImage = this.doctorRepository.create();
    newImage.photo = imageUrl;
    newImage.id = doctorId;
    await this.doctorRepository.save(newImage, { reload: true });

    return { image_url: newImage.photo };
  }

  async getDoctorProfiel(doctorId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      select: [
        'id',
        'name',
        'photo',
        'email',
        'phone',
        'collegeyear',
        'governorate',
        'university',
      ],
    });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    return { data: doctor };
  }

  
 
}
