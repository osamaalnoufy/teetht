import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';

import { User } from './user.entity';
import { Content } from './same.entity';
import { DoctorCondition } from './doctorCondition.entity';
import { DoctorSession } from './doctorSession.entity';
import { ResetToken } from './resetTokenSchema.entity';
import { Tokens } from './tokens.entity';
import { DoctorImage } from './doctorImage.entity';
@Entity('doctors')
export class Doctor extends Content {
  @Index('doctors_email_idx', { unique: true })
  @Column('character varying', { nullable: false, length: 50 })
  email: string;
  @Column('character varying', { nullable: false, length: 25 })
  university: string;
  @Column('character varying', { nullable: false, length: 30 })
  collegeyear: string;
  @ManyToMany(() => User, (user) => user.doctors, { eager: false })
  @JoinTable()
  users: User[];

  @OneToMany(
    () => DoctorCondition,
    (doctorCondition) => doctorCondition.doctor,
    { eager: false, cascade: true, onDelete: 'CASCADE' },
  )
  conditions: DoctorCondition[];

  @OneToMany(() => DoctorSession, (session) => session.doctor, {
    eager: false,
    cascade: true,
    onDelete: 'CASCADE',
  })
  sessions: DoctorSession[];
  @OneToMany(() => ResetToken, (resetToken) => resetToken.doctor, {
    eager: false,
    cascade: true,
    onDelete: 'CASCADE',
  })
  resetTokens: ResetToken[];

  @OneToMany(() => Tokens, (tokens) => tokens.doctor, {
    eager: false,
    cascade: true,
    onDelete: 'CASCADE',
  })
  tokens: Tokens[];
  @OneToMany(() => DoctorImage, (doctorImage) => doctorImage.doctor, {
    eager: false,
    cascade: true,
    onDelete: 'CASCADE',
  })
  images: DoctorImage[];
}
