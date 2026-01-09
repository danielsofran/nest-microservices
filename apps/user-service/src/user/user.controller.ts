import { Controller, Inject } from '@nestjs/common';
import { ClientKafka, ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClientNames } from '../client.names';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(ClientNames.PAYMENT_SERVICE)
    private readonly paymentService: ClientKafka,
    @Inject(ClientNames.MAIL_SERVICE)
    private readonly mailService: ClientProxy,
  ) {}

  @MessagePattern('create')
  async create(@Payload() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    this.paymentService.emit('addUser', user)
    const adminMails = await this.userService.findAdminUserMails()
    this.mailService.emit('send', {
      mailList: adminMails,
      subject: 'New User Registered',
      template: './test-template',
      context: {
        title: 'New User Registered',
        message: `A new user has registered with the email: ${user.email}`,
        type: 'info',
        sentAt: new Date().toLocaleString(),
        year: new Date().getFullYear(),
      },
    })
    return user
    // const id = result['id'] as string;
    // await this.userService.update(user.id, { stripeCustomerId: id })
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
  async update(@Payload() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(+updateUserDto.id, updateUserDto);
    this.paymentService.emit('addUser', user)
    return user;
  }

  @MessagePattern('remove')
  async remove(@Payload() id: number) {
    const removed = await this.userService.remove(+id);
    this.paymentService.emit('removeUser', id);
    return removed;
  }
}
