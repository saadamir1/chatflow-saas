import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    
    if (!stripeSecretKey && nodeEnv === 'production') {
      throw new Error('STRIPE_SECRET_KEY is required in production');
    }
    
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-08-27.basil',
      });
    }
  }

  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    if (!this.stripe) {
      // Mock customer for development
      return {
        id: `cus_mock_${Date.now()}`,
        email,
        name,
      } as Stripe.Customer;
    }
    return this.stripe.customers.create({
      email,
      name,
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    description?: string,
  ): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) {
      // Mock payment intent for development
      return {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_mock`,
        amount: Math.round(amount * 100),
        currency,
        status: 'requires_payment_method',
      } as Stripe.PaymentIntent;
    }
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      description,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.Subscription> {
    if (!this.stripe) {
      // Mock subscription for development
      const now = Math.floor(Date.now() / 1000);
      return {
        id: `sub_mock_${Date.now()}`,
        status: 'active',
        current_period_start: now,
        current_period_end: now + (30 * 24 * 60 * 60), // 30 days
        items: {
          data: [{
            price: {
              unit_amount: priceId === 'price_pro' ? 800 : 1500, // $8 or $15
            }
          }]
        }
      } as any;
    }
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    };

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    return this.stripe.subscriptions.create(subscriptionData);
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async constructWebhookEvent(payload: string, signature: string): Promise<Stripe.Event> {
    if (!this.stripe) {
      throw new Error('Stripe webhooks not available in development mode');
    }
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  // Price IDs for different plans (set these in your Stripe dashboard)
  getPriceId(planType: string): string {
    const priceIds = {
      pro: this.configService.get<string>('STRIPE_PRO_PRICE_ID') || 'price_pro_mock',
      enterprise: this.configService.get<string>('STRIPE_ENTERPRISE_PRICE_ID') || 'price_enterprise_mock',
    };
    const priceId = priceIds[planType];
    if (!priceId) {
      throw new Error(`Price ID not configured for plan: ${planType}`);
    }
    return priceId;
  }
}