import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, PlanType, SubscriptionStatus } from '../entities/subscription.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentInput, CreateSubscriptionInput } from '../dto/billing.dto';
import { WorkspacesService } from '../../workspaces/workspaces.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private stripeService: StripeService,
    private workspacesService: WorkspacesService,
  ) {}

  async createPaymentIntent(
    createPaymentIntentInput: CreatePaymentIntentInput,
    workspaceId: number,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const { amount, description } = createPaymentIntentInput;

    // Get workspace subscription for customer ID
    let subscription = await this.getWorkspaceSubscription(workspaceId);
    
    if (!subscription.stripeCustomerId) {
      // Create Stripe customer if doesn't exist
      const workspace = await this.workspacesService.findOne(workspaceId);
      const customer = await this.stripeService.createCustomer(
        `workspace-${workspace.id}@${workspace.slug}.com`,
        workspace.name,
      );
      
      subscription.stripeCustomerId = customer.id;
      await this.subscriptionRepository.save(subscription);
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(
      amount,
      'usd',
      subscription.stripeCustomerId,
      description,
    );

    // Save payment record
    await this.paymentRepository.save({
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency: 'usd',
      status: PaymentStatus.PENDING,
      description,
      workspaceId,
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  async createSubscription(
    createSubscriptionInput: CreateSubscriptionInput,
    workspaceId: number,
  ): Promise<{ subscriptionId: string; status: string; clientSecret?: string }> {
    const { planType, paymentMethodId } = createSubscriptionInput;

    if (planType === PlanType.FREE) {
      throw new ConflictException('Cannot create subscription for free plan');
    }

    let subscription = await this.getWorkspaceSubscription(workspaceId);
    
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new ConflictException('Workspace already has an active subscription');
    }

    // Create Stripe customer if doesn't exist
    if (!subscription.stripeCustomerId) {
      const workspace = await this.workspacesService.findOne(workspaceId);
      const customer = await this.stripeService.createCustomer(
        `workspace-${workspace.id}@${workspace.slug}.com`,
        workspace.name,
      );
      
      subscription.stripeCustomerId = customer.id;
    }

    const priceId = this.stripeService.getPriceId(planType);
    const stripeSubscription = await this.stripeService.createSubscription(
      subscription.stripeCustomerId,
      priceId,
      paymentMethodId,
    );

    // Update subscription record
    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.planType = planType;
    subscription.status = stripeSubscription.status as SubscriptionStatus;
    subscription.currentPeriodStart = new Date((stripeSubscription as any).current_period_start * 1000);
    subscription.currentPeriodEnd = new Date((stripeSubscription as any).current_period_end * 1000);
    
    if (stripeSubscription.items.data[0]?.price?.unit_amount) {
      subscription.amount = stripeSubscription.items.data[0].price.unit_amount / 100;
    }

    await this.subscriptionRepository.save(subscription);

    const response: any = {
      subscriptionId: stripeSubscription.id,
      status: stripeSubscription.status,
    };

    // If subscription requires payment confirmation
    if (stripeSubscription.latest_invoice && 
        typeof stripeSubscription.latest_invoice === 'object' &&
        (stripeSubscription.latest_invoice as any).payment_intent &&
        typeof (stripeSubscription.latest_invoice as any).payment_intent === 'object') {
      response.clientSecret = (stripeSubscription.latest_invoice as any).payment_intent.client_secret;
    }

    return response;
  }

  async getWorkspaceSubscription(workspaceId: number): Promise<Subscription> {
    let subscription = await this.subscriptionRepository.findOne({
      where: { workspaceId },
    });

    if (!subscription) {
      // Create default free subscription
      subscription = this.subscriptionRepository.create({
        workspaceId,
        planType: PlanType.FREE,
        status: SubscriptionStatus.TRIALING,
        amount: 0,
        currency: 'usd',
      });
      await this.subscriptionRepository.save(subscription);
    }

    return subscription;
  }

  async getWorkspacePayments(workspaceId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelSubscription(workspaceId: number): Promise<{ message: string; success: boolean }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { workspaceId, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new NotFoundException('No active subscription found');
    }

    await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);
    
    subscription.status = SubscriptionStatus.CANCELED;
    await this.subscriptionRepository.save(subscription);

    return {
      message: 'Subscription canceled successfully',
      success: true,
    };
  }
}