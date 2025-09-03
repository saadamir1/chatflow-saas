import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './services/billing.service';
import { StripeService } from './services/stripe.service';
import { PlanLimitsService } from './services/plan-limits.service';
import { BillingResolver } from './billing.resolver';
import { WebhookController } from './webhook.controller';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';
import { UsageRecord } from './entities/usage.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment, UsageRecord]),
    WorkspacesModule,
  ],
  controllers: [WebhookController],
  providers: [BillingResolver, BillingService, StripeService, PlanLimitsService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}