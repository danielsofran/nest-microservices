import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete, Inject, UseGuards
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ClientNames } from './client.names';
import { JwtAuthGuard } from './jwt.guard';

// @UseGuards(JwtAuthGuard)
@Controller("users")
export class UserController {
  constructor(
    @Inject(ClientNames.USER_SERVICE)
    private readonly userService: ClientProxy
  ) {}

  @Post()
  create(@Body() createUserDto: object) {
    return this.userService.send("create", createUserDto)
  }

  @Get()
  findAll() {
    return this.userService.send("findAll", {})
  }

  @Get(":id")
  findOne(@Param("id") id: number) {
    return this.userService.send("findOne", id)
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: object) {
    return this.userService.send("update", { id, ...updateUserDto })
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.userService.send("remove", id)
  }
}
