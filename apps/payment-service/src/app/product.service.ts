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
      const existingProduct = await this.getStripeProduct(product);

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

  async removeProduct(productId: string | number): Promise<boolean> {
    try {
      const id = typeof productId === 'number' ? productId.toString() : productId;

      // Search for product by metadata id
      const searchResult = await this.stripe.products.search({
        query: `metadata["id"]:"${id}"`,
        limit: 1,
      });

      if (searchResult.data.length === 0) {
        this.logger.warn(`Product not found with metadata id: ${id}`);

        // Fallback: try searching by name if productId might be a name
        const nameSearchResult = await this.stripe.products.search({
          query: `name:"${productId}"`,
          limit: 1,
        });

        if (nameSearchResult.data.length === 0) {
          this.logger.error(`Product not found with any criteria: ${productId}`);
          return false;
        }

        const product = nameSearchResult.data[0];

        // Archive/delete the product
        await this.stripe.products.update(product.id, { active: false });

        // Optionally delete the product (careful - this is permanent!)
        // await this.stripe.products.del(product.id);

        this.logger.log(`Product "${product.name}" (ID: ${product.id}) deactivated`);
        return true;
      }

      const product = searchResult.data[0];

      // Deactivate/archive the product
      await this.stripe.products.update(product.id, { active: false });

      // Optional: Archive associated prices
      await this.archiveProductPrices(product.id);

      // Optional: Completely delete the product (permanent!)
      // await this.stripe.products.del(product.id);

      this.logger.log(`Product with metadata id ${id} (Stripe ID: ${product.id}) removed/deactivated`);
      return true;

    } catch (error: any) {
      this.logger.error(`Failed to remove product: ${productId}`, error.stack);
      return false;
    }
  }

  // Additional helper method to remove by internal product object
  async removeProductByInternalId(internalId: number): Promise<boolean> {
    return this.removeProduct(internalId);
  }

  // Additional helper method to remove by name
  async removeProductByName(productName: string): Promise<boolean> {
    return this.removeProduct(productName);
  }

  // Helper method to archive all prices for a product
  private async archiveProductPrices(productId: string): Promise<void> {
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      });

      for (const price of prices.data) {
        await this.stripe.prices.update(price.id, { active: false });
        this.logger.log(`Price ${price.id} archived for product ${productId}`);
      }
    } catch (error: any) {
      this.logger.warn(`Failed to archive prices for product ${productId}: ${error.message}`);
    }
  }

  async getStripeProduct(product: Product): Promise<Stripe.Product | null> {
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
    return existingProduct || null;
  }

  async getProductDefaultPrice(productId: string): Promise<Stripe.Price | null> {
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
      // Get current active prices
      const oldPrices = await this.stripe.prices.list({
        product: productId,
        active: true,
      });

      // Create new price first
      const newPrice = await this.stripe.prices.create({
        product: productId,
        unit_amount: unitAmount,
        currency: currency.toLowerCase(),
        active: true,
      });

      // Update product to use the new price as default
      await this.stripe.products.update(productId, {
        default_price: newPrice.id,
      });

      // Now archive old prices (only after setting new default)
      for (const price of oldPrices.data) {
        // Skip if this is the same as the new price (shouldn't happen but just in case)
        if (price.id !== newPrice.id) {
          await this.stripe.prices.update(price.id, { active: false });
          this.logger.log(`Archived old price: ${price.id}`);
        }
      }

      return newPrice;
    } catch (error) {
      this.logger.error(`Failed to update price for product ${productId}`, error);
      throw error;
    }
  }
}
