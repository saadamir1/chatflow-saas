import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum PaymentStatus {
  SUCCEEDED = 'succeeded',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded'
}

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
});

@ObjectType()
@Entity({ name: 'payments' })
export class Payment {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  stripePaymentIntentId: string;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Field()
  @Column({ default: 'usd' })
  currency: string;

  @Field(() => PaymentStatus)
  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata: any;

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