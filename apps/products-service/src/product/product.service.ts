import { Injectable } from "@nestjs/common"
import { CreateProductDto } from "./dto/create-product.dto"
import { UpdateProductDto } from "./dto/update-product.dto"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Product } from "./product.entity"

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>
  ) {}
  create(createUserDto: CreateProductDto) {
    return this.productRepository.save(createUserDto)
  }

  findAll() {
    return this.productRepository.find()
  }

  findOne(id: number) {
    return this.productRepository.findOne({
      where: { id },
    })
  }

  async update(id: number, updateUserDto: UpdateProductDto) {
    const entity = await this.productRepository.findOneBy({ id })
    const updatedData = {
      ...entity,
      ...updateUserDto,
    }
    await this.productRepository.update({id: id}, updatedData)
    return updatedData
  }

  async remove(id: number) {
    const deleted = { id }
    await this.productRepository.delete(id)
    return deleted
  }
}