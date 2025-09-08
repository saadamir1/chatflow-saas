import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
@ObjectType()
export class Notification {
  @PrimaryGeneratedColumn()
  @Field(() => ID)
  id: number;

  @Column()
  @Field()
  userId: number;

  @Column()
  @Field()
  type: string;

  @Column()
  @Field()
  title: string;

  @Column()
  @Field()
  message: string;

  @Column({ nullable: true }) 
  @Field({ nullable: true })
  referenceId?: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  referenceType?: string;

  @Column({ default: false })
  @Field()
  read: boolean;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
