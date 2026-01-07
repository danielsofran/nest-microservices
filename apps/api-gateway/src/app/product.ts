export interface Product {
  id: number;  // Stripe uses string IDs, often prefixed with 'prod_'

  name: string;  // Equivalent to firstName/lastName

  description: string;

  active: boolean;  // Whether the product is currently available

  stripe_product_id: string;  // If syncing with Stripe

  price: number;  // Default price amount

  currency: string;

  created: Date;  // Note: Stripe uses 'created' not 'createdAt'

  updated: Date;  // Note: Stripe uses 'updated' not 'updatedAt'
}

interface Element {
  product: Product
  quantity: number
}

export interface Cart {
  products: Element[]
}