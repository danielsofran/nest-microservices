import { Controller } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { UserService } from './user.service';
import { ProductService } from './product.service';
import { MessagePattern } from '@nestjs/microservices';
import { type User } from './user';
import { type Product } from './product';

@Controller()
export class AppController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly userService: UserService,
    private readonly productService: ProductService
  ) {}

  @MessagePattern('getBalance')
  getBalance() {
    return this.stripeService.getBalance();
  }

  @MessagePattern('addUser')
  addCustomer(data: User) {
    return this.userService.createOrGetCustomer(data)
  }

  @MessagePattern('addProduct')
  addProduct(data: Product) {
    return this.productService.createOrGetProduct(data)
  }
}
