import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChangePasswordService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}
  async changePasswordDoctor(
    doctorId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('User not found');
    }
    const passwordMatch = await bcrypt.compare(oldPassword, doctor.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    doctor.password = newHashedPassword;
    await this.doctorRepository.save(doctor);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async changePasswordUser(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await this.userRepository.save(user);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }
   async addPassword(
    doctorId: number,
    password: string,
  ): Promise<{ message: string }> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    doctor.password = hashedPassword;
    await this.doctorRepository.save(doctor);
    return { message: 'Password changed successfully' };
  }
}
