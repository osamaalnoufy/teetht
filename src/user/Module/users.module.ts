import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorImage } from 'src/entities/doctorImage.entity';
import { User } from 'src/entities/user.entity';
import { UserService } from '../Services/User/user.service';
import { JwtStrategy } from '../Strategies/jwt-strategy';
import { DoctorService } from '../Services/Doctor/doctor.service';
import { MailService } from 'src/mailer/mailer.service';
import { ChangePassword } from '../Controllers/Auth/ResetPassword/changePassword.controller';
import { ForgotPassword } from '../Controllers/Auth/ResetPassword/forgotPassword.controller';
import { ResetPassword } from '../Controllers/Auth/ResetPassword/resetPassword.controller';
import { AuthController } from '../Controllers/Auth/auth.controller';
import { CrudController } from '../Controllers/CURD/curd.controller';
import { ResetToken } from 'src/entities/resetTokenSchema.entity';
import { Tokens } from 'src/entities/tokens.entity';
import { GoogleStrategy } from '../Strategies/google.strategy';
import { LocalDoctorStrategy } from '../Strategies/localdoctor-strategy';
import { LocalUserStrategy } from '../Strategies/localuser-strategy';
import { AuthService } from '../Services/Auth/auth.service';
import { ChangePasswordService } from '../Services/Auth/ResetPassword/changePassword.service';
import { ForgotPasswordService } from '../Services/Auth/ResetPassword/forgotPassword.service';
import { ResetPasswordService } from '../Services/Auth/ResetPassword/resetPassword.service';
import { JwtModule } from '@nestjs/jwt';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Doctor, ResetToken, Tokens, DoctorImage]),
    forwardRef(() => UsersModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '600m' },
    }),
  ],
  exports: [TypeOrmModule, UserService, JwtModule],
  controllers: [
    ChangePassword,
    ForgotPassword,
    ResetPassword,
    AuthController,
    CrudController,
  ],
  providers: [
    AuthService,
    ChangePasswordService,
    ForgotPasswordService,
    ResetPasswordService,
    JwtStrategy,
    UserService,
    DoctorService,
    MailService,
    GoogleStrategy,
    LocalDoctorStrategy,
    LocalUserStrategy,
    CloudinaryService,
  ],
})
export class UsersModule {}
