import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('create')
  create(@Payload() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @MessagePattern('findAll')
  findAll() {
    return this.userService.findAll();
  }

  @MessagePattern('findOne')
  findOne(@Payload() id: number) {
    return this.userService.findOne(+id);
  }

  @MessagePattern('findOneByEmail')
  findOneByEmail(@Payload() email: string) {
    return this.userService.findOneByEmail(email);
  }

  @MessagePattern('findAdminMails')
  findAdmins() {
    return this.userService.findAdminUserMails();
  }

  @MessagePattern('update')
  update(@Payload() updateUserDto: UpdateUserDto) {
    return this.userService.update(+updateUserDto.id, updateUserDto);
  }

  @MessagePattern('remove')
  remove(@Payload() id: number) {
    return this.userService.remove(+id);
  }
}
