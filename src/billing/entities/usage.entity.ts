import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@ObjectType()
@Entity({ name: 'usage_records' })
export class UsageRecord {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  feature: string; // 'messages', 'storage', 'users', etc.

  @Field(() => Int)
  @Column({ type: 'integer', default: 0 })
  quantity: number;

  @Field()
  @Column({ type: 'date' })
  date: Date;

  @Field(() => Workspace)
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column()
  workspaceId: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}