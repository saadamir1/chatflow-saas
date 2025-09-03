import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'audit_logs' })
export class AuditLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'integer', nullable: true })
  userId?: number;

  @Field()
  @Column({ type: 'varchar' })
  action: string;

  @Field()
  @Column({ type: 'varchar' })
  entity: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'integer', nullable: true })
  entityId?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  details?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  userAgent?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
