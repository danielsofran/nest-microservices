import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientNames } from './client.names';
import { UserController } from './users.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ClientNames.MAIL_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@localhost:5672'],
          queue: 'mails',
          queueOptions: {
            durable: false
          },
        },
      },
      {
        name: ClientNames.USER_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@localhost:5672'],
          queue: 'user_queue',
          queueOptions: {
            durable: true
          },
        },
      },
    ]),
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
