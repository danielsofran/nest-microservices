import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientNames } from './client.names';
import { UserController } from './users.controller';
import { ProductsController } from './products.controller';
import { PassportModule } from '@nestjs/passport';
import { PasswordStrategy } from './password.strategy';
import { PasswordGuard } from './password.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule,
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
      {
        name: ClientNames.PAYMENT_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@localhost:5672'],
          queue: 'payment_queue_tmp',
          queueOptions: {
            durable: false
          },
        },
      },
      {
        name: ClientNames.PRODUCTS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@localhost:5672'],
          queue: 'product_queue',
          queueOptions: {
            durable: true
          },
        },
      },
    ]),
  ],
  controllers: [AppController, UserController, ProductsController, AuthController],
  providers: [AppService, AuthService, PasswordGuard, PasswordStrategy],
})
export class AppModule {}
