import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Condition } from './condition.entity';

@Entity('condition_levels')
export class ConditionLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level_description: string;

  @Column()
  condition_id: number;
  @OneToOne(() => Condition, (condition) => condition.level)
  @JoinColumn({ name: 'condition_id' })
  condition: Condition;
}
