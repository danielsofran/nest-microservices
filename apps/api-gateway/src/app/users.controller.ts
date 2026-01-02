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

@Controller("users")
export class UserController {
  constructor(
    @Inject(ClientNames.USER_SERVICE)
    private readonly userService: ClientProxy
  ) {}

  @Post()
  create(@Body() createUserDto: object) {
    return this.userService.send("createUser", createUserDto)
  }

  @Get()
  findAll() {
    return this.userService.send("findAllUser", {})
  }

  @Get(":id")
  findOne(@Param("id") id: number) {
    return this.userService.send("findOneUser", id)
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: object) {
    return this.userService.send("updateUser", { id, ...updateUserDto })
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.userService.send("removeUser", id)
  }
}
