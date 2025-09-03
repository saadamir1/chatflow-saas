import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillingService } from './services/billing.service';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';
import { 
  CreatePaymentIntentInput, 
  CreateSubscriptionInput, 
  PaymentIntentResponse, 
  SubscriptionResponse 
} from './dto/billing.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @Mutation(() => PaymentIntentResponse)
  createPaymentIntent(
    @Args('createPaymentIntentInput') createPaymentIntentInput: CreatePaymentIntentInput,
    @CurrentUser() user: any,
  ): Promise<PaymentIntentResponse> {
    return this.billingService.createPaymentIntent(createPaymentIntentInput, user.workspaceId);
  }

  @Mutation(() => SubscriptionResponse)
  createSubscription(
    @Args('createSubscriptionInput') createSubscriptionInput: CreateSubscriptionInput,
    @CurrentUser() user: any,
  ): Promise<SubscriptionResponse> {
    return this.billingService.createSubscription(createSubscriptionInput, user.workspaceId);
  }

  @Query(() => Subscription, { name: 'myBillingSubscription' })
  getMySubscription(@CurrentUser() user: any): Promise<Subscription> {
    return this.billingService.getWorkspaceSubscription(user.workspaceId);
  }

  @Query(() => [Payment], { name: 'myPayments' })
  getMyPayments(@CurrentUser() user: any): Promise<Payment[]> {
    return this.billingService.getWorkspacePayments(user.workspaceId);
  }

  @Mutation(() => Boolean)
  cancelSubscription(@CurrentUser() user: any): Promise<{ message: string; success: boolean }> {
    return this.billingService.cancelSubscription(user.workspaceId);
  }
}