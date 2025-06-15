import { Injectable, NotFoundException } from '@nestjs/common';
import { UserSession } from 'src/entities/userSession.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { Condition } from 'src/entities/condition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { UserCondition } from 'src/entities/userCondition.entity';
import { ConditionSelectionDto } from '../dto/conditionSelectionDto';
import { SessionDTO } from '../dto/sessionDto';
import { FindDoctorDTO } from '../dto/findDoctorsOrUserDto';

@Injectable()
export class CasesUserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(UserCondition)
    private userConditionRepository: Repository<UserCondition>,

    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,

    @InjectRepository(Condition)
    private conditionRepository: Repository<Condition>,

    @InjectRepository(ConditionLevel)
    private conditionLevelRepository: Repository<ConditionLevel>,
  ) {}

  async saveUserChoices(
    conditionSelectionDtos: ConditionSelectionDto[],
    userId: number,
  ): Promise<SessionDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id'],
    });
    if (!user) {
      throw new Error('User not found');
    }
    const userSession = new UserSession();
    userSession.user = user;
    userSession.conditions = [];
    await this.userSessionRepository.save(userSession);

    const userConditionsPromises = conditionSelectionDtos.map(async (dto) => {
      const condition = await this.conditionRepository.findOne({
        where: { id: dto.condition_id },
      });

      const level = dto.level_id
        ? await this.conditionLevelRepository.findOne({
            where: { id: dto.level_id },
          })
        : null;

      const userCondition = new UserCondition();
      userCondition.condition = condition;
      userCondition.level = level;
      userCondition.user = user;
      userCondition.session = userSession;
      return await this.userConditionRepository.save(userCondition);
    });
    userSession.conditions = await Promise.all(userConditionsPromises);
    const sessionData = [];
    const userSessionDTO = new SessionDTO(sessionData);
    userSessionDTO.data = [];

    for (const userCondition of userSession.conditions) {
      userSessionDTO.data.push({
        condition: userCondition.condition.name,
        level: userCondition.level
          ? userCondition.level.level_description
          : null,
      });
    }

    return userSessionDTO;
  }

  async deleteUserSession(userSessionId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const session = await queryRunner.manager.findOne(UserSession, {
        where: {
          id: userSessionId,
        },
        select: ['id'],
      });

      if (!session) {
        throw new NotFoundException('لم يتم العثور على جلسة الطبيب المطلوبة.');
      }

      await queryRunner.manager.delete(UserCondition, {
        session: { id: session.id },
      });

      await queryRunner.manager.delete(UserSession, {
        id: session.id,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async getUserSessionId(userId: number): Promise<UserSession | null> {
    return await this.userSessionRepository.findOne({
      where: { user: { id: userId } },
    });
  }
  async findMatchingDoctorsInSameGobernorate(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });

    if (!user || user.conditions.length === 0) {
      throw new Error('No conditions found for user or user does not exist.');
    }

    const [conditionId, levelId] = user.conditions.reduce(
      (acc, cur) => {
        if (cur && cur.condition) {
          acc[0].push(cur.condition.id);
          acc[1].push(cur.level ? cur.level.id : null);
        }
        return acc;
      },
      [[], []],
    );

    const doctorsQuery = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.conditions', 'doctorCondition')
      .leftJoinAndSelect('doctorCondition.condition', 'condition')
      .leftJoinAndSelect('doctorCondition.level', 'conditionLevel')
      .where('doctor.governorate = :governorate', {
        governorate: user.governorate,
      });

    if (conditionId.length > 0) {
      doctorsQuery.andWhere(
        '(condition.id IN (:...conditionId) AND (conditionLevel.id IN (:...levelId) OR conditionLevel.id IS NULL))',
        {
          conditionId,
          levelId: levelId.filter((id) => id !== 'none'),
        },
      );
    }

    const doctors = await doctorsQuery.getMany();

    const uniqueDoctors = doctors.reduce((acc, currentDoctor) => {
      const existingDoctorIndex = acc.findIndex(
        (doc) => doc.id === currentDoctor.id,
      );

      if (existingDoctorIndex > -1) {
        acc[existingDoctorIndex].conditions = [
          ...new Set([
            ...acc[existingDoctorIndex].conditions,
            ...currentDoctor.conditions,
          ]),
        ];
      } else {
        acc.push(currentDoctor);
      }
      return acc;
    }, []);

    return uniqueDoctors.map((doctor) => new FindDoctorDTO(doctor));
  }

  async findMatchingDoctorsInOtherGovernorate(
    userId: number,
    selectedGovernorate: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });

    if (!user || user.conditions.length === 0) {
      throw new Error('No conditions found for user or user does not exist.');
    }

    const [conditionId, levelId] = user.conditions.reduce(
      (acc, cur) => {
        if (cur && cur.condition) {
          acc[0].push(cur.condition.id);
          acc[1].push(cur.level ? cur.level.id : null);
        }
        return acc;
      },
      [[], []],
    );

    const doctorsQuery = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.conditions', 'doctorCondition')
      .leftJoinAndSelect('doctorCondition.condition', 'condition')
      .leftJoinAndSelect('doctorCondition.level', 'conditionLevel')
      .where('doctor.governorate = :selectedGovernorate', {
        selectedGovernorate,
      });

    if (conditionId.length > 0) {
      doctorsQuery.andWhere(
        '(condition.id IN (:...conditionId) AND (conditionLevel.id IN (:...levelId) OR conditionLevel.id IS NULL))',
        {
          conditionId,
          levelId: levelId.filter((id) => id !== 'none'),
        },
      );
    }

    const doctors = await doctorsQuery.getMany();

    const uniqueDoctors = doctors.reduce((acc, currentDoctor) => {
      const existingDoctorIndex = acc.findIndex(
        (doc) => doc.id === currentDoctor.id,
      );

      if (existingDoctorIndex > -1) {
        acc[existingDoctorIndex].conditions = [
          ...new Set([
            ...acc[existingDoctorIndex].conditions,
            ...currentDoctor.conditions,
          ]),
        ];
      } else {
        acc.push(currentDoctor);
      }
      return acc;
    }, []);

    return uniqueDoctors.map((doctor) => new FindDoctorDTO(doctor));
  }
}
