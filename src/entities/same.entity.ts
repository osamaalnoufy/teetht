import { BeforeInsert, Column, Entity, Index, PrimaryColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
@Entity('content')
export abstract class Content {
  @PrimaryColumn('int')
  id: number;

  @Column('character varying', { nullable: false, length: 50 })
  name: string;

  @Column('character varying', { nullable: false, length: 130 })
  password: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
  @Column({ nullable: true })
  photo: string;
  @Index('content_phone_idx', { unique: true })
  @Column('character varying', { nullable: false, length: 10 })
  phone: string;

  @Column('character varying', { nullable: false, length: 10 })
  governorate: string;

  @Column('character varying', { nullable: false, length: 10 })
  role: string;
}
