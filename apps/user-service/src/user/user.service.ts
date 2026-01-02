import { Injectable } from "@nestjs/common"
import { CreateUserDto } from "./dto/create-user.dto"
import { UpdateUserDto } from "./dto/update-user.dto"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { User } from "./user.entity"

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>
  ) {}
  create(createUserDto: CreateUserDto) {
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

  async findOneByEmail(email: string) {
    return await this.usersRepository.findOne({
      where: { email },
    })
  }

  async findOneByUsername(username: string) {
    return await this.usersRepository.findOne({
      where: { firstName: username },
    })
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
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