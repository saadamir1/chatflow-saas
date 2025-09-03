import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeService } from './services/stripe.service';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private stripeService: StripeService,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() rawBody: any,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    try {
      const event = await this.stripeService.constructWebhookEvent(
        JSON.stringify(rawBody),
        signature,
      );

      this.logger.log(`Received Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          this.logger.warn(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook error:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.SUCCEEDED;
      await this.paymentRepository.save(payment);
      this.logger.log(`Payment ${paymentIntent.id} marked as succeeded`);
    }
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
      this.logger.log(`Payment ${paymentIntent.id} marked as failed`);
    }
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const localSubscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (localSubscription) {
      localSubscription.status = subscription.status as SubscriptionStatus;
      localSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      localSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      
      if (subscription.items.data[0]?.price) {
        localSubscription.amount = subscription.items.data[0].price.unit_amount / 100;
      }

      await this.subscriptionRepository.save(localSubscription);
      this.logger.log(`Subscription ${subscription.id} updated`);
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const localSubscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (localSubscription) {
      localSubscription.status = SubscriptionStatus.CANCELED;
      await this.subscriptionRepository.save(localSubscription);
      this.logger.log(`Subscription ${subscription.id} canceled`);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
    // Handle successful invoice payment if needed
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);
    
    if (invoice.subscription) {
      const subscription = await this.subscriptionRepository.findOne({
        where: { stripeSubscriptionId: invoice.subscription },
      });

      if (subscription) {
        subscription.status = SubscriptionStatus.PAST_DUE;
        await this.subscriptionRepository.save(subscription);
      }
    }
  }
}