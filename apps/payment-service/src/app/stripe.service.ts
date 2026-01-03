import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { Product } from './product';

@Injectable()
export class StripeService {
  private stripe: Stripe
  private readonly logger = new Logger(StripeService.name)

  constructor(
    @Inject("STRIPE_API_KEY")
    private readonly apiKey: string
  ) {
    this.logger.log(apiKey)
    this.stripe = new Stripe(this.apiKey)
  }

  // Get Balance - Sum available amounts
  async getBalance(): Promise<{ amount: number; currency: string }> {
    try {
      const balance = await this.stripe.balance.retrieve();

      // Sum all available balances (might be multiple currencies)
      const totalAvailable = balance.available.reduce((sum, item) => {
        return sum + item.amount;
      }, 0);

      // Get the primary currency (usually the first one)
      const primaryCurrency = balance.available[0]?.currency || 'ron';

      this.logger.log(`Balance retrieved successfully: ${totalAvailable} ${primaryCurrency}`);

      return {
        amount: totalAvailable,
        currency: primaryCurrency
      };
    } catch (error: any) {
      this.logger.error("Failed to retrieve balance", error.stack);
      throw error;
    }
  }

  // Create of get product
  async createOrGetProduct(product: Product): Promise<Stripe.Product> {
    try {
      // Check if product already exists
      const existingProducts = await this.stripe.products.list({ limit: 100 });
      const existingProduct = existingProducts.data.find(product => product.name === product.name);

      if (existingProduct) {
        this.logger.log(`Product "${product.name}" already exists. Returning existing product.`);
        return existingProduct;
      }

      // Create new product
      const stripeProduct = await this.stripe.products.create({
        name: product.name,
        description: product.description,
        default_price_data: {
          unit_amount: product.price * 100, // Convert to cents
          currency: product.currency,
        },
      });

      this.logger.log(`Product "${product.name}" created successfully.`);
      return stripeProduct;
    } catch (error: any) {
      this.logger.error(`Failed to create or get product "${product.name}"`, error.stack);
      throw error;
    }
  }
}
