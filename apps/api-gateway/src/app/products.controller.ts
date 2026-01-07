import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete, Inject, UseGuards, Request
} from '@nestjs/common';
import { ClientKafka, ClientProxy } from '@nestjs/microservices';
import { ClientNames } from './client.names';
import { JwtAuthGuard } from './jwt.guard';
import { type Cart } from './product';
import { firstValueFrom } from 'rxjs';

@UseGuards(JwtAuthGuard)
@Controller("products")
export class ProductsController {
  constructor(
    @Inject(ClientNames.PRODUCTS_SERVICE)
    private readonly productsService: ClientProxy,
    @Inject(ClientNames.PAYMENT_SERVICE)
    private readonly paymentService: ClientKafka,
  ) {}

  @Post()
  create(@Body() createProductDto: object) {
    return this.productsService.send("create", createProductDto)
  }

  @Get()
  findAll() {
    return this.productsService.send("findAll", {})
  }

  @Get(":id")
  findOne(@Param("id") id: number) {
    return this.productsService.send("findOne", id)
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateProductDto: object) {
    return this.productsService.send("update", { id, ...updateProductDto })
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.productsService.send("remove", id)
  }

  @Post("payment")
  doPayment(@Request() req: any, @Body() cart: Cart) {
    // get authenticated user
    const user = {
      id: req.user.userId,
      email: req.user.email,
    }
    this.paymentService.emit("doPayment", { products: cart.products, user })
    return {
      message: 'Payment processing started',
    };
  }
  
  @Post("payment/link")
  async getPaymentLink(@Request() req: any, @Body() cart: Cart) {
    // get authenticated user
    const user = {
      id: req.user.userId,
      email: req.user.email,
    }
    this.paymentService.subscribeToResponseOf('getPaymentLink');
    const rez = await firstValueFrom(this.paymentService.send("getPaymentLink", { products: cart.products, user }));
    return rez;
  }
}
