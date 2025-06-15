import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { ResetToken } from 'src/entities/resetTokenSchema.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(ResetToken)
    private resetToken: Repository<ResetToken>,
  ) {}

  async resetPasswordDoctor(newPassword: string, resetToken: string) {
    const token = await this.resetToken.findOne({
      where: {
        token: resetToken,
        expiry_date: MoreThanOrEqual(new Date()),
      },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid link');
    }
    const doctor = await this.doctorRepository.findOne({
      where: { id: token.doctor_id },
    });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    doctor.password = newHashedPassword;
    await this.doctorRepository.save(doctor);
    await this.resetToken.remove(token);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }
}
