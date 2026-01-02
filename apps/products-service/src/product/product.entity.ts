import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;  // Stripe uses string IDs, often prefixed with 'prod_'

  @Column({ nullable: false })
  name: string;  // Equivalent to firstName/lastName

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;  // Whether the product is currently available

  // Stripe-specific fields (you might not need these if using Stripe's API directly)
  @Column({ type: 'varchar', nullable: true })
  stripe_product_id: string;  // If syncing with Stripe

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;  // Default price amount

  @Column({ type: 'varchar', nullable: true, default: 'usd' })
  currency: string;

  @CreateDateColumn()
  created: Date;  // Note: Stripe uses 'created' not 'createdAt'

  @UpdateDateColumn()
  updated: Date;  // Note: Stripe uses 'updated' not 'updatedAt'
}