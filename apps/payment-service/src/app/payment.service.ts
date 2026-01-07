import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { Cart, Product } from './product';
import { UserService } from './user.service';
import { ProductService } from './product.service';
import { User } from './user';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);
  private successFallbackUrl;

  constructor(
    @Inject('STRIPE_API_KEY')
    private readonly apiKey: string,
    private readonly productService: ProductService,
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {
    this.logger.log(apiKey);
    this.stripe = new Stripe(this.apiKey);
    this.successFallbackUrl = this.configService.get<string>(
      'STRIPE_SUCCESS_URL',
      'http://localhost:3000/payment/success'
    );
  }

  async createPaymentLinkForOneProduct(
    myProduct: Product,
    user: User
  ): Promise<Stripe.PaymentLink | false> {
    const product: Stripe.Product | null =
      await this.productService.getStripeProduct(myProduct);
    const customer: Stripe.Customer | null = await this.userService.getCustomer(
      user
    );
    if (!product || !customer) {
      this.logger.warn('Product or user does not exist');
      return false;
    }
    const price: Stripe.Price | null =
      await this.productService.getProductDefaultPrice(product.id);
    if (!price) {
      this.logger.error(`No active price found for product: ${product.id}`);
      return false;
    }

    return await this.stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.FRONTEND_URL}/payment-success`, // Your success URL
        },
      },
      metadata: {
        product_id: myProduct.id.toString(),
        user_id: user.id.toString(),
        product_name: myProduct.name,
        user_email: customer.email?.toString() || '',
      },
    });
  }

  async doPaymentForOneProduct(myProduct: Product, user: User): Promise<boolean> {
    const product: Stripe.Product | null =
      await this.productService.getStripeProduct(myProduct);
    const customer: Stripe.Customer | null = await this.userService.getCustomer(
      user
    );
    if (!product || !customer) {
      this.logger.warn('Product or user does not exist');
      return false;
    }
    const price: Stripe.Price | null =
      await this.productService.getProductDefaultPrice(product.id);
    if (!price) {
      this.logger.error(`No active price found for product: ${product.id}`);
      return false;
    }
    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: price.unit_amount || 0,
      currency: price.currency,
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        product_id: product.id.toString(),
        product_name: product.name,
        user_id: user.id.toString(),
        user_email: user.email,
      },
    });
    this.logger.log(`Payment intent created: ${paymentIntent.id}`);
    // Simulate payment confirmation (in test mode)
    const confirmedPayment = await this.simulatePayment(paymentIntent.id);
    if (confirmedPayment) {
      this.logger.log(`Payment successful for user ${user.id} - product "${product.name}"`);
      return true;
    }
    return false;
  }

  async doPaymentForMoreProducts(cart: Cart, user: User): Promise<boolean> {
    const customer: Stripe.Customer | null = await this.userService.getCustomer(
      user
    );
    if (!customer) {
      this.logger.warn('Product or user does not exist');
      return false;
    }
    let amount = 0
    const stripeProductIds = []
    let currency = null
    for (const item of cart.products) {
      const stripeProduct = await this.productService.getStripeProduct(item.product)
      if (!stripeProduct) continue
      const price = await this.productService.getProductDefaultPrice(stripeProduct.id)
      if (!price) continue
      if (!currency) currency = price.currency
      amount += (price.unit_amount || 0) * item.quantity
      stripeProductIds.push(stripeProduct.id.toString())
    }

    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: currency!,
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        product_ids: stripeProductIds.join(','),
        user_id: user.id.toString(),
        user_email: user.email,
      },
    });
    this.logger.log(`Payment intent created: ${paymentIntent.id}`);
    // Simulate payment confirmation (in test mode)
    const confirmedPayment = await this.simulatePayment(paymentIntent.id);
    if (confirmedPayment) {
      this.logger.log(`Payment successful for user ${user.id} for products", ${stripeProductIds.join(',')}`);
      return true;
    }
    return false;
  }

  async createPaymentLinkForMoreProducts(cart: Cart, user: User): Promise<Stripe.PaymentLink | false> {
    const customer: Stripe.Customer | null = await this.userService.getCustomer(
      user
    );
    if (!customer) {
      this.logger.warn('Product or user does not exist');
      return false;
    }
    const line_items = []
    const stripeProductIds = []
    for (const item of cart.products) {
      const stripeProduct = await this.productService.getStripeProduct(item.product)
      if (!stripeProduct) continue
      const price = await this.productService.getProductDefaultPrice(stripeProduct.id)
      if (!price) continue
      line_items.push({
        price: price.id,
        quantity: item.quantity,
      })
      stripeProductIds.push(stripeProduct.id.toString())
    }

    const url = this.configService.get<string>("STRIPE_SUCCESS_REDIRECT_URL", "http://localhost:3000/payment/success");

    return await this.stripe.paymentLinks.create({
      line_items: line_items,
      after_completion: {
        type: 'redirect',
        redirect: {
          url: url, // Your success URL
        },
      },
      metadata: {
        product_ids: stripeProductIds.join(','),
        user_id: user.id.toString(),
        user_email: customer.email?.toString() || '',
      },
    });
  }

  // Simulate payment confirmation (for test mode)
  private async simulatePayment(paymentIntentId: string): Promise<boolean> {
    try {
      // In test mode, we can simulate successful payment
      // For real payments, you'd integrate with Stripe Elements or Checkout

      // Create a test payment method
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: '4242424242424242', // Test card number
          exp_month: 12,
          exp_year: new Date().getFullYear() + 1,
          cvc: '123',
        },
      });

      // Attach payment method to payment intent
      await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethod.id,
        return_url: this.successFallbackUrl, // For redirect flows
      });

      // Finalize the payment
      const finalizedPayment = await this.stripe.paymentIntents.capture(
        paymentIntentId
      );

      return finalizedPayment.status === 'succeeded';
    } catch (error: any) {
      this.logger.error(`Payment simulation failed: ${error.message}`);

      // Alternative: use Stripe's test helpers
      if (
        error.type === 'StripeInvalidRequestError' &&
        error.code === 'resource_missing'
      ) {
        // For test mode, you can also use test tokens
        return await this.simulateWithTestToken(paymentIntentId);
      }

      return false;
    }
  }

  // Alternative simulation method
  private async simulateWithTestToken(
    paymentIntentId: string
  ): Promise<boolean> {
    try {
      // Use Stripe's test token (in test mode only)
      const testSource = await this.stripe.tokens.create({
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: new Date().getFullYear() + 1,
          cvc: '123',
        },
      });

      await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method_data: {
          type: 'card',
          card: {
            token: testSource.id,
          },
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Test token payment failed: ${error.message}`);
      return false;
    }
  }
}
