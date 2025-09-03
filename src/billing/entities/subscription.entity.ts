import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing'
}

export enum PlanType {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus',
});

registerEnumType(PlanType, {
  name: 'PlanType',
});

@ObjectType('BillingSubscription')
@Entity({ name: 'subscriptions' })
export class Subscription {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true, nullable: true })
  stripeSubscriptionId: string;

  @Field()
  @Column({ nullable: true })
  stripeCustomerId: string;

  @Field(() => PlanType)
  @Column({ type: 'enum', enum: PlanType, default: PlanType.FREE })
  planType: PlanType;

  @Field(() => SubscriptionStatus)
  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status: SubscriptionStatus;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Field()
  @Column({ default: 'usd' })
  currency: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  trialEnd: Date;

  @Field(() => Workspace)
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column()
  workspaceId: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}