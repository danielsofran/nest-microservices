import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientNames } from './client.names';
import { UserController } from './users.controller';
import { ProductsController } from './products.controller';
import { PassportModule } from '@nestjs/passport';
import { PasswordStrategy } from './password.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>("JWT_SECRET"),
    signOptions: {
      expiresIn: configService.get<string>("JWT_EXPIRATION") as any,
    },
  }),
})

@Module({
  imports: [
    jwtModule,
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env', '.private.env'],
    }),
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
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          }
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
  providers: [AppService, AuthService, JwtStrategy, PasswordStrategy],
})
export class AppModule {}
