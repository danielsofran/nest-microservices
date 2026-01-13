import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { User } from './user';

@Injectable()
export class UserStripeService {
  private stripe: Stripe
  private readonly logger = new Logger(UserStripeService.name)

  constructor(
    @Inject("STRIPE_API_KEY")
    private readonly apiKey: string
  ) {
    this.stripe = new Stripe(this.apiKey)
  }

  async createOrGetCustomer(user: User): Promise<Stripe.Customer> {
    try {
      const existingCustomer = await this.getCustomer(user);

      // If customer exists, update if needed
      if (existingCustomer) {
        const needsUpdate = this.shouldUpdateCustomer(existingCustomer, user);

        if (needsUpdate) {
          this.logger.log(`Updating customer: "${user.email}"`);
          const updatedCustomer = await this.stripe.customers.update(existingCustomer.id, {
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            metadata: this.getCustomerMetadata(user),
          });
          return updatedCustomer;
        }
        return existingCustomer;
      }

      // Create new customer
      const customerData: Stripe.CustomerCreateParams = {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: this.getCustomerMetadata(user),
      };

      const stripeCustomer = await this.stripe.customers.create(customerData);

      // 6. Optionally store stripe customer ID in your database
      // await this.userRepository.update(user.id, {
      //   stripe_customer_id: stripeCustomer.id
      // });

      this.logger.log(`Customer created for "${user.email}" with ID: ${stripeCustomer.id}`);

      return stripeCustomer;
    } catch (error: any) {
      this.logger.error(`Failed for user "${user.email}"`, error.stack);

      // 7. Better error handling
      if (error.type === 'StripeInvalidRequestError') {
        throw new Error(`Invalid customer data: ${error.message}`);
      }
      if (error.code === 'resource_missing') {
        throw new Error(`Customer creation failed: ${error.message}`);
      }

      throw error;
    }
  }

  async getCustomer(user: User): Promise<Stripe.Customer|null> {
    if (user.email === undefined || user.email === null) {
      this.logger.warn(`User email is undefined or null for user ID: ${user.id}`);
      return null;
    }
    this.logger.log(`Processing user/customer: "${user.email}"`);

    // 1. Search for existing customer by email
    let existingCustomer: Stripe.Customer | null = null;

    try {
      const searchResult = await this.stripe.customers.search({
        query: `email:\"${user.email}\"`,
        limit: 1,
      });

      if (searchResult.data.length > 0) {
        existingCustomer = searchResult.data[0];
        this.logger.log(`Found existing customer: "${user.email}" (ID: ${existingCustomer.id})`);
      }
    } catch (searchError: any) {
      this.logger.warn(`Customer search API failed: ${searchError.message}`);

      // 4. Fallback: List with pagination
      // if (!existingCustomer) {
      //   let hasMore = true;
      //   let startingAfter: string | undefined;
      //
      //   while (hasMore && !existingCustomer) {
      //     const customersList = await this.stripe.customers.list({
      //       limit: 100,
      //       email: user.email,
      //       starting_after: startingAfter,
      //     });
      //
      //     if (customersList.data.length > 0) {
      //       existingCustomer = customersList.data[0];
      //     }
      //
      //     hasMore = customersList.has_more;
      //     startingAfter = customersList.data[customersList.data.length - 1]?.id;
      //   }
      // }
    }
    return existingCustomer;
  }

  private getCustomerMetadata(user: User): Stripe.MetadataParam {
    return {
      user_id: user?.id?.toString(),
      internal_user_id: user?.id?.toString(), // Redundant but clear
      user_role: user.role,
      google_id: user.googleId || '',
      created_at: new Date(user.createdAt).toISOString(), // convert to date cause it's sent as string
      updated_at: new Date(user.updatedAt).toISOString(),
      app_name: 'nestjs-microservice', // Customize this
    };
  }

  private shouldUpdateCustomer(existingCustomer: Stripe.Customer, user: User): boolean {
    // Check if name changed
    const currentName = `${user.firstName} ${user.lastName}`.trim();
    const existingName = existingCustomer.name || '';

    if (currentName !== existingName) {
      return true;
    }

    // Check if email changed
    if (user.email !== existingCustomer.email) {
      return true;
    }

    // Check if metadata needs update
    const currentMetadata = this.getCustomerMetadata(user);
    const existingMetadata = existingCustomer.metadata || {};

    // Compare key metadata fields
    if (existingMetadata.user_id !== currentMetadata.user_id ||
      existingMetadata.user_role !== currentMetadata.user_role ||
      existingMetadata.google_id !== currentMetadata.google_id) {
      return true;
    }

    return false;
  }

  // Get customer by internal user ID from metadata
  async getCustomerByInternalId(userId: number): Promise<Stripe.Customer | null> {
    try {
      const searchResult = await this.stripe.customers.search({
        query: `metadata["user_id"]:"${userId}"`,
        limit: 1,
      });

      if (searchResult.data.length > 0) {
        return searchResult.data[0];
      }

      // Alternative: search with internal_user_id
      const searchResult2 = await this.stripe.customers.search({
        query: `metadata["internal_user_id"]:"${userId}"`,
        limit: 1,
      });

      return searchResult2.data[0] || null;
    } catch (error: any) {
      this.logger.warn(`Search customer by internal ID failed: ${error.message}`);
      return null;
    }
  }

  // Delete customer (if needed)
  async deleteCustomer(userId: number): Promise<boolean> {
    try {
      const customer = await this.getCustomerByInternalId(userId);
      if (!customer) {
        this.logger.warn(`Customer not found for user ID: ${userId}`);
        return false;
      }

      await this.stripe.customers.del(customer.id);
      this.logger.log(`Customer deleted: ${customer.id} for user ID: ${userId}`);

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to delete customer for user ID: ${userId}`, error.stack);
      return false;
    }
  }
}
