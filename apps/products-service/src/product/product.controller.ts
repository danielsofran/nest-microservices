import { Controller, Inject } from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ClientNames } from '../client.names';

@Controller()
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    @Inject(ClientNames.PAYMENT_SERVICE)
    private readonly paymentService: ClientKafka
  ) {}

  @MessagePattern('create')
  async create(@Payload() createProductDto: CreateProductDto) {
    const product = await this.productService.create(createProductDto);
    this.paymentService.emit('addProduct', product);
    return product;
  }

  @MessagePattern('findAll')
  findAll() {
    return this.productService.findAll();
  }

  @MessagePattern('findOne')
  findOne(@Payload() id: number) {
    return this.productService.findOne(+id);
  }

  @MessagePattern('update')
  async update(@Payload() updateProductDto: UpdateProductDto) {
    const product = await this.productService.update(+updateProductDto.id, updateProductDto);
    this.paymentService.emit('addProduct', product);
    return product;
  }

  @MessagePattern('removeProduct')
  async remove(@Payload() id: number) {
    await this.productService.remove(+id);
    this.paymentService.emit('removeProduct', { id });
  }
}
