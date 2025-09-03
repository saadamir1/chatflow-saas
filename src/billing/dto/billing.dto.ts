import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { PlanType } from '../entities/subscription.entity';

@InputType()
export class CreatePaymentIntentInput {
  @Field()
  @IsNumber()
  @Min(0.5)
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class CreateSubscriptionInput {
  @Field(() => PlanType)
  planType: PlanType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

@ObjectType()
export class PaymentIntentResponse {
  @Field()
  clientSecret: string;

  @Field()
  paymentIntentId: string;
}

@ObjectType()
export class SubscriptionResponse {
  @Field()
  subscriptionId: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  clientSecret?: string;
}