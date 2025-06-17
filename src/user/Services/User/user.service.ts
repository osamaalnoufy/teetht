import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorImage } from 'src/entities/doctorImage.entity';
import { UpdateUserDto } from 'src/user/Dtos/User/updateUserDto.dto';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(DoctorImage)
    private readonly doctorImageRepository: Repository<DoctorImage>,
  ) {}

  async findOne(phone: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { phone } });
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (
      updateUserDto.phone !== undefined &&
      updateUserDto.phone !== user.phone
    ) {
      const existingUserWithPhone =
        (await this.userRepository.findOne({
          where: { phone: updateUserDto.phone },
        })) ||
        (await this.doctorRepository.findOne({
          where: { phone: updateUserDto.phone },
        }));
      if (existingUserWithPhone) {
        throw new ConflictException('phone number already exists');
      }
      user.phone = updateUserDto.phone;
    }
    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }
    if (updateUserDto.governorate !== undefined) {
      user.governorate = updateUserDto.governorate;
    }
    await this.userRepository.save(user);
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'phone', 'governorate'],
    });

    return updatedUser;
  }

  async getUserProfiel(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'photo', 'phone', 'governorate'],
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return { data: user };
  }
  async uploadPhotoUser(imageUrl: string, userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const newImage = this.userRepository.create();
    newImage.photo = imageUrl;
    newImage.id = userId;
    await this.userRepository.save(newImage, { reload: true });

    return { image_url: newImage.photo };
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    await this.userRepository.delete(userId);
    return { message: 'user deleted successfully' };
  }
}
