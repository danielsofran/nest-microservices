import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { Product } from './product';

@Injectable()
export class ProductService {
  private stripe: Stripe
  private readonly logger = new Logger(ProductService.name)

  constructor(
    @Inject("STRIPE_API_KEY")
    private readonly apiKey: string
  ) {
    this.stripe = new Stripe(this.apiKey)
  }

  async createOrGetProduct(product: Product): Promise<Stripe.Product> {
    try {
      this.logger.log(`Processing product: "${product.name}"`);

      // 1. Search using Stripe's search API
      let existingProduct: Stripe.Product | null | undefined = null;

      try {
        const searchResult = await this.stripe.products.search({
          query: `name:\"${product.name}\"`,
          limit: 1,
        });

        if (searchResult.data.length > 0) {
          existingProduct = searchResult.data[0];
          this.logger.log(`Found existing product: "${product.name}" (ID: ${existingProduct.id})`);
        }
      } catch (searchError: any) {
        this.logger.warn(`Search API failed: ${searchError.message}`);

        // 4. Fallback: List with pagination
        if (!existingProduct) {
          let hasMore = true;
          let startingAfter: string | undefined;

          while (hasMore && !existingProduct) {
            const productsList = await this.stripe.products.list({
              limit: 100,
              starting_after: startingAfter,
            });

            existingProduct = productsList.data.find(p => p.name === product.name);

            hasMore = productsList.has_more;
            startingAfter = productsList.data[productsList.data.length - 1]?.id;
          }
        }
      }

      // If product exists, return it
      if (existingProduct) {
        // 5. Update price if different
        if (product.price && product.currency) {
          const currentPrice = await this.getProductDefaultPrice(existingProduct.id);
          const priceInCents = Math.round(product.price * 100);

          if (!currentPrice ||
            currentPrice.unit_amount !== priceInCents ||
            currentPrice.currency !== product.currency.toLowerCase()) {
            await this.createOrUpdatePrice(existingProduct.id, priceInCents, product.currency);
          }
        }

        return existingProduct;
      }

      // Create new product
      const productData: Stripe.ProductCreateParams = {
        name: product.name,
        description: product.description,
        active: product.active,
        metadata: {
          id: product.id.toString(),
          source: 'nestjs-payment-service',
        }
      };

      // Add price if provided
      if (product.price && product.currency) {
        productData.default_price_data = {
          currency: product.currency.toLowerCase(),
          unit_amount: Math.round(product.price * 100),
        };
      }

      const stripeProduct = await this.stripe.products.create(productData);

      // 6. Set stripe_product_id in your database if needed
      // await this.productRepository.update(product.id, {
      //   stripe_product_id: stripeProduct.id
      // });

      this.logger.log(`Product "${product.name}" created with ID: ${stripeProduct.id}`);

      return stripeProduct;
    } catch (error: any) {
      this.logger.error(`Failed for product "${product.name}"`, error.stack);

      // 7. Better error handling
      if (error.type === 'StripeInvalidRequestError') {
        throw new Error(`Invalid product data: ${error.message}`);
      }
      if (error.code === 'resource_missing') {
        throw new Error(`Product creation failed: ${error.message}`);
      }

      throw error;
    }
  }

  private async getProductDefaultPrice(productId: string): Promise<Stripe.Price | null> {
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
        limit: 1,
      });

      return prices.data[0] || null;
    } catch (error: any) {
      this.logger.warn(`Failed to get price for product ${productId}: ${error.message}`);
      return null;
    }
  }

  private async createOrUpdatePrice(
    productId: string,
    unitAmount: number,
    currency: string
  ): Promise<Stripe.Price> {
    try {
      // Deactivate old active prices
      const oldPrices = await this.stripe.prices.list({
        product: productId,
        active: true,
      });

      for (const price of oldPrices.data) {
        await this.stripe.prices.update(price.id, { active: false });
      }

      // Create new price
      return await this.stripe.prices.create({
        product: productId,
        unit_amount: unitAmount,
        currency: currency.toLowerCase(),
        active: true,
      });
    } catch (error) {
      this.logger.error(`Failed to update price for product ${productId}`, error);
      throw error;
    }
  }
}
