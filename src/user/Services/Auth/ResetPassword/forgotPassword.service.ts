import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { ResetToken } from 'src/entities/resetTokenSchema.entity';
import { MailService } from 'src/mailer/mailer.service';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
@Injectable()
export class ForgotPasswordService {
  constructor(
    private mailService: MailService,
    @InjectRepository(ResetToken)
    private resetToken: Repository<ResetToken>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}
  async forgotPasswordDoctor(email: string) {
    const doctor = await this.doctorRepository.findOne({ where: { email } });
    if (doctor) {
      const expiry_date = new Date();
      expiry_date.setHours(expiry_date.getHours() + 1);
      const restToken = nanoid(64);
      const resetTokenObject = this.resetToken.create({
        token: restToken,
        doctor_id: doctor.id,
        expiry_date,
      });
      await this.resetToken.save(resetTokenObject);
      this.mailService.sendPasswordResetEmail(email, restToken);
    }
    return { message: 'If this user exists, they will receive an email.' };
  }
}
