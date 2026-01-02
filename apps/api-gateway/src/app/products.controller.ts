import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete, Inject
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ClientNames } from './client.names';

@Controller("products")
export class ProductsController {
  constructor(
    @Inject(ClientNames.PRODUCTS_SERVICE)
    private readonly productsService: ClientProxy
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
}
