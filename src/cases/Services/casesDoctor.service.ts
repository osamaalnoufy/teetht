import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Condition } from 'src/entities/condition.entity';
import { Doctor } from 'src/entities/doctor.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ConditionSelectionDto } from '../dto/conditionSelectionDto';
import { SessionDTO } from '../dto/sessionDto';
import { DoctorSession } from 'src/entities/doctorSession.entity';
import { DoctorCondition } from 'src/entities/doctorCondition.entity';
import { FindUserDTO } from '../dto/findDoctorsOrUserDto';

@Injectable()
export class CasesDoctorService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,

    @InjectRepository(DoctorSession)
    private doctorSessionRepository: Repository<DoctorSession>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Condition)
    private conditionRepository: Repository<Condition>,

    @InjectRepository(DoctorCondition)
    private doctorConditionRepository: Repository<DoctorCondition>,

    @InjectRepository(ConditionLevel)
    private conditionLevelRepository: Repository<ConditionLevel>,
  ) {}
  async saveDoctorChoices(
    conditionSelectionDtos: ConditionSelectionDto[],
    doctorId: number,
  ): Promise<SessionDTO> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      select: ['id'],
    });
    if (!doctor) {
      throw new NotFoundException('doctor not found');
    }
    const doctorSession = new DoctorSession();
    doctorSession.doctor = doctor;
    doctorSession.conditions = [];
    await this.doctorSessionRepository.save(doctorSession);

    const doctorConditionsPromises = conditionSelectionDtos.map(async (dto) => {
      const condition = await this.conditionRepository.findOne({
        where: { id: dto.condition_id },
      });
      if (!condition) {
        throw new NotFoundException(
          `Condition with id ${dto.condition_id} not found`,
        );
      }

      let level = null;
      if (dto.level_id) {
        level = await this.conditionLevelRepository.findOne({
          where: { id: dto.level_id },
          select: ['id', 'level_description'],
        });
        if (!level) {
          throw new NotFoundException(
            `Level with id ${dto.level_id} not found`,
          );
        }
      }

      const doctorCondition = new DoctorCondition();
      doctorCondition.condition = condition;
      doctorCondition.level = level;
      doctorCondition.doctor = doctor;
      doctorCondition.session = doctorSession;
      return await this.doctorConditionRepository.save(doctorCondition);
    });

    doctorSession.conditions = await Promise.all(doctorConditionsPromises);

    const sessionData = [];
    const doctorSessionDTO = new SessionDTO(sessionData);
    doctorSessionDTO.data = [];

    for (const doctorCondition of doctorSession.conditions) {
      doctorSessionDTO.data.push({
        condition: doctorCondition.condition.name,
        level: doctorCondition.level
          ? doctorCondition.level.level_description
          : null,
      });
    }

    return doctorSessionDTO;
  }

  async deleteDoctorSession(doctorSessionId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const session = await queryRunner.manager.findOne(DoctorSession, {
        where: {
          id: doctorSessionId,
        },
        select: ['id'],
      });

      if (!session) {
        throw new NotFoundException('لم يتم العثور على جلسة الطبيب المطلوبة.');
      }

      await queryRunner.manager.delete(DoctorCondition, {
        session: { id: session.id },
      });

      await queryRunner.manager.delete(DoctorSession, {
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
  async findMatchingUsersInSameGobernorate(userId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });

    if (!doctor || doctor.conditions.length === 0) {
      throw new Error('No conditions found for user or user does not exist.');
    }

    const [conditionId, levelId] = doctor.conditions.reduce(
      (acc, cur) => {
        if (cur && cur.condition) {
          acc[0].push(cur.condition.id);
          acc[1].push(cur.level ? cur.level.id : null);
        }
        return acc;
      },
      [[], []],
    );

    const usersQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.conditions', 'userCondition')
      .leftJoinAndSelect('userCondition.condition', 'condition')
      .leftJoinAndSelect('userCondition.level', 'conditionLevel')
      .where('user.governorate = :governorate', {
        governorate: doctor.governorate,
      });

    if (conditionId.length > 0) {
      usersQuery.andWhere(
        '(condition.id IN (:...conditionId) AND (conditionLevel.id IN (:...levelId) OR conditionLevel.id IS NULL))',
        {
          conditionId,
          levelId: levelId.filter((id) => id !== 'none'),
        },
      );
    }

    const users = await usersQuery.getMany();

    const uniqueUsers = users.reduce((acc, currentUser) => {
      const existingUserIndex = acc.findIndex(
        (doc) => doc.id === currentUser.id,
      );

      if (existingUserIndex > -1) {
        acc[existingUserIndex].conditions = [
          ...new Set([
            ...acc[existingUserIndex].conditions,
            ...currentUser.conditions,
          ]),
        ];
      } else {
        acc.push(currentUser);
      }
      return acc;
    }, []);

    return uniqueUsers.map((doctor) => new FindUserDTO(doctor));
  }
  async findMatchingUsersInOtherGobernorate(
    userId: number,
    selectedGovernorate: string,
  ) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });

    if (!doctor || doctor.conditions.length === 0) {
      throw new Error('No conditions found for user or user does not exist.');
    }

    const [conditionId, levelId] = doctor.conditions.reduce(
      (acc, cur) => {
        if (cur && cur.condition) {
          acc[0].push(cur.condition.id);
          acc[1].push(cur.level ? cur.level.id : null);
        }
        return acc;
      },
      [[], []],
    );

    const usersQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.conditions', 'userCondition')
      .leftJoinAndSelect('userCondition.condition', 'condition')
      .leftJoinAndSelect('userCondition.level', 'conditionLevel')
      .where('user.governorate = :selectedGovernorate', {
        selectedGovernorate,
      });

    if (conditionId.length > 0) {
      usersQuery.andWhere(
        '(condition.id IN (:...conditionId) AND (conditionLevel.id IN (:...levelId) OR conditionLevel.id IS NULL))',
        {
          conditionId,
          levelId: levelId.filter((id) => id !== 'none'),
        },
      );
    }

    const users = await usersQuery.getMany();

    const uniqueUsers = users.reduce((acc, currentUser) => {
      const existingUserIndex = acc.findIndex(
        (doc) => doc.id === currentUser.id,
      );

      if (existingUserIndex > -1) {
        acc[existingUserIndex].conditions = [
          ...new Set([
            ...acc[existingUserIndex].conditions,
            ...currentUser.conditions,
          ]),
        ];
      } else {
        acc.push(currentUser);
      }
      return acc;
    }, []);

    return uniqueUsers.map((doctor) => new FindUserDTO(doctor));
  }
  async getDoctorSessionId(doctorId: number): Promise<DoctorSession | null> {
    return await this.doctorSessionRepository.findOne({
      where: { doctor: { id: doctorId } },
    });
  }
}
