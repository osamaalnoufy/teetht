import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DoctorService } from 'src/user/Services/Doctor/doctor.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/Services/User/user.service';
import { User } from 'src/entities/user.entity';
import { Doctor } from 'src/entities/doctor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { MailService } from 'src/mailer/mailer.service';
import { Tokens } from 'src/entities/tokens.entity';
import { CreateDoctorDto, CreateUserDto } from 'src/user/Dtos/Auth/authDto.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private doctorService: DoctorService,
    private jwtService: JwtService,
    private mailService: MailService,

    @InjectRepository(Tokens)
    private tokens: Repository<Tokens>,
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}
  async findNextAvailableIdUsers(): Promise<number> {
    const query = `
      WITH gaps AS (
        SELECT id FROM generate_series(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM users)) AS id
        EXCEPT
        SELECT id FROM users
      )
      SELECT COALESCE(MIN(id), 1) AS next_id FROM gaps;`;

    const result = await this.dataSource.query(query);
    return result[0]?.next_id || 1;
  }
  async findNextAvailableIdDoctor(): Promise<number> {
    const query = `
      WITH gaps AS (
        SELECT id FROM generate_series(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM doctors)) AS id
        EXCEPT
        SELECT id FROM doctors
      )
      SELECT COALESCE(MIN(id), 1) AS next_id FROM gaps;`;

    const result = await this.dataSource.query(query);
    return result[0]?.next_id || 1;
  }
  async createDoctor(
    createDoctorDto: CreateDoctorDto,
  ): Promise<{ message: string }> {
    const { email, name, phone } = createDoctorDto;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const conflictQuery = `
          SELECT 1 FROM doctors WHERE email = $1
          UNION
          SELECT 1 FROM doctors WHERE phone = $2
          UNION
          SELECT 1 FROM users WHERE  phone = $2
        `;
      const conflicts = await queryRunner.query(conflictQuery, [email, phone]);

      if (conflicts.length > 0) {
        await queryRunner.rollbackTransaction();
        throw new ConflictException(
          'An account with similar email, or phone already exists.',
        );
      }
      const nextId = await this.findNextAvailableIdDoctor();
      const newDoctor = queryRunner.manager.create(Doctor, {
        id: nextId,
        name: createDoctorDto.name,
        email: createDoctorDto.email,
        phone: createDoctorDto.phone,
        password: createDoctorDto.password,
        collegeyear: createDoctorDto.collegeyear,
        governorate: createDoctorDto.governorate,
        university: createDoctorDto.university,
        role: createDoctorDto.role,
        image: 'null',
      });
      await queryRunner.manager.save(newDoctor);

      const tokens = nanoid(64);
      const expiry_date = new Date();
      expiry_date.setMinutes(expiry_date.getMinutes() + 2);

      const resetTokenObject = queryRunner.manager.create(Tokens, {
        token: tokens,
        doctor: newDoctor,
        expiry_date,
      });
      await queryRunner.manager.save(resetTokenObject);
      this.mailService.sendToken(email, tokens);
      await queryRunner.commitTransaction();
      return {
        message:
          'successfully registered , Please check your email for verification code.',
      };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const { name, phone } = createUserDto;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const conflictQuery = `
            SELECT 1 FROM users WHERE  phone = $1
            UNION
            SELECT 1 FROM doctors WHERE  phone = $1
          `;
      const conflicts = await queryRunner.query(conflictQuery, [phone]);

      if (conflicts.length > 0) {
        await queryRunner.rollbackTransaction();
        throw new ConflictException(
          'A user with the same phone already exists.',
        );
      }
      const nextId = await this.findNextAvailableIdUsers();
      const newUser = queryRunner.manager.create(User, {
        id: nextId,
        name: createUserDto.name,
        phone: createUserDto.phone,
        password: createUserDto.password,
        governorate: createUserDto.governorate,
        role: createUserDto.role,
        image: 'null',
      });
      await queryRunner.manager.save(newUser);

      await queryRunner.commitTransaction();
      return { message: 'successfully registered' };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async validateUser(phone: string, password: string): Promise<any> {
    const user = await this.userService.findOne(phone);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async validateDoctor(email: string, password: string): Promise<any> {
    const doctor = await this.doctorService.findOne(email);
    if (doctor && (await bcrypt.compare(password, doctor.password))) {
      const { ...result } = doctor;
      return result;
    }
    return null;
  }

  async loginUesr(user: User) {
    const user_info = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      governorate: user.governorate,
      photo: user.photo,
      role: user.role,
    };
    const tokens = {
      access_token: await this.jwtService.signAsync(user_info, {
        secret: `${process.env.JWT_SECRET}`,
      }),
      refresh_token: await this.jwtService.signAsync(
        { ...user_info, countEx: 3 },
        { secret: process.env.JWT_SECRET_REFRESHTOKEN, expiresIn: '7d' },
      ),
    };
    return {
      status: 200,
      message: 'user logged in successfully',
      user_info,
      tokens,
    };
  }
  async loginDoctor(doctor: Doctor) {
    const doctor_info = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      governorate: doctor.governorate,
      university: doctor.university,
      collegeyear: doctor.collegeyear,
      photo: doctor.photo,
      role: doctor.role,
    };
    const tokens = {
      access_token: await this.jwtService.signAsync(doctor_info, {
        secret: `${process.env.JWT_SECRET}`,
      }),
      refresh_token: await this.jwtService.signAsync(
        { ...doctor_info, countEx: 3 },
        { secret: `${process.env.JWT_SECRET_REFRESHTOKEN}`, expiresIn: '7d' },
      ),
    };
    return {
      status: 200,
      message: 'doctor logged in successfully',
      doctor_info,
      tokens,
    };
  }
  async refreshTokenDoctor(doctor: Doctor) {
    const doctor_info = {
      id: doctor.id,
      username: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      governorate: doctor.governorate,
      university: doctor.university,
      collegeyear: doctor.collegeyear,
    };
    return {
      access_token: await this.jwtService.signAsync(doctor_info, {
        expiresIn: '30d',
      }),
    };
  }
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: `${process.env.JWT_SECRET_REFRESHTOKEN}`,
      });

      if (!payload || payload.countEx <= 0) {
        throw new UnauthorizedException(
          'Invalid refresh token,please go to login again',
        );
      }
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTimestamp) {
        throw new UnauthorizedException(
          'Refresh token has expired, please login again',
        );
      }
      const { exp, countEx, ...newPayload } = payload;
      const newPayoadForAccessToken = {
        id: newPayload.id,
        email: newPayload.email,
        role: newPayload.role,
      };
      const access_token = await this.jwtService.signAsync(
        newPayoadForAccessToken,
        {
          secret: process.env.JWT_SECRET,
        },
      );
      const newCountEx = countEx - 1;
      const refresh_token = await this.jwtService.signAsync(
        { ...newPayload, countEx: newCountEx },
        {
          secret: process.env.JWT_SECRET_REFRESHTOKEN,
          expiresIn: '7d',
        },
      );
      return {
        status: 201,
        message: 'Refresh Access token successfully',
        access_token,
        refresh_token,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Refresh token has expired, please login again',
        );
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(
          'Invalid refresh token, please login again',
        );
      }
      throw error;
    }
  }

  async verifyTheEmail(token: string): Promise<{ message: string }> {
    const tokens = await this.tokens.findOne({
      where: {
        token: token,
        expiry_date: MoreThanOrEqual(new Date()),
      },
    });
    if (!tokens) {
      throw new NotFoundException('Token not found or has been expired');
    } else {
      await this.tokens.remove(tokens);
      return { message: 'Email verified successfully' };
    }
  }
}
