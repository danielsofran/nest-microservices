import { Injectable } from "@nestjs/common"
import { CreateProductDto } from "./dto/create-product.dto"
import { UpdateProductDto } from "./dto/update-product.dto"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Product } from "./product.entity"

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private usersRepository: Repository<Product>
  ) {}
  create(createUserDto: CreateProductDto) {
    return this.usersRepository.save(createUserDto)
  }

  findAll() {
    return this.usersRepository.find()
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
    })
  }

  async update(id: number, updateUserDto: UpdateProductDto) {
    const entity = await this.usersRepository.findOneBy({ id })
    const updated = await this.usersRepository.save({
      ...entity,
      ...updateUserDto,
    })
    return updated
  }

  async remove(id: number) {
    const deleted = { id }
    await this.usersRepository.delete(id)
    return deleted
  }
}