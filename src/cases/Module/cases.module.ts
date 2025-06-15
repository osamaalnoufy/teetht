import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorCondition } from 'src/entities/doctorCondition.entity';
import { Condition } from 'src/entities/condition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { DoctorSession } from 'src/entities/doctorSession.entity';
import { User } from 'src/entities/user.entity';
import { UserCondition } from 'src/entities/userCondition.entity';
import { UserSession } from 'src/entities/userSession.entity';
import { CasesUserService } from 'src/cases/Services/casesUser.service';
import { CasesUserController } from 'src/cases/Controllers/casesUser.controller';
import { CasesDoctorController } from '../Controllers/casesDoctor.controller';
import { CasesDoctorService } from '../Services/casesDoctor.service';
import { JwtStrategy } from 'src/user/Strategies/jwt-strategy';
import { UsersModule } from 'src/user/Module/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      DoctorSession,
      Condition,
      Doctor,
      DoctorCondition,
      ConditionLevel,
      UserCondition,
      UserSession,
    ]),
    UsersModule,
  ],
  controllers: [CasesUserController, CasesDoctorController],
  providers: [JwtStrategy, CasesUserService, CasesDoctorService],
})
export class CasesModule {}
