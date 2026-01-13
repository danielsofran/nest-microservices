import { Controller } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { UserStripeService } from './user.stripe.service';
import { ProductStripeService } from './product.stripe.service';
import { MessagePattern } from '@nestjs/microservices';
import { type User } from './user';
import { type Cart, type Payload, type Product } from './product';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly userService: UserStripeService,
    private readonly productService: ProductStripeService,
    private readonly paymentService: PaymentService
  ) {}

  @MessagePattern('getBalance')
  getBalance() {
    return this.stripeService.getBalance();
  }

  @MessagePattern('addUser')
  addCustomer(data: User) {
    return this.userService.createOrGetCustomer(data);
  }

  @MessagePattern('removeUser')
  removeCustomer(id: number) {
    return this.userService.deleteCustomer(id);
  }

  @MessagePattern('addProduct')
  addProduct(data: Product) {
    return this.productService.createOrGetProduct(data);
  }

  @MessagePattern('removeProduct')
  removeProduct(id: number) {
    return this.productService.removeProduct(id);
  }

  @MessagePattern('doPayment')
  async doPayment(payload: Payload) {
    return this.paymentService.doPaymentForMoreProducts(payload, payload.user);
  }

  @MessagePattern('getPaymentLink')
  async getPaymentLink(payload: Payload) {
    const link = await this.paymentService.createPaymentLinkForMoreProducts(
      payload,
      payload.user
    );
    return link ? link.url : null;
  }
}
