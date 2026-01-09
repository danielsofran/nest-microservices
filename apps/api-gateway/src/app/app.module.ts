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
import { EventsModule } from './events.module';

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
    EventsModule,
    jwtModule,
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env', '.private.env'],
    }),
    ClientsModule.registerAsync([
      {
        name: ClientNames.MAIL_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672')],
            queue: 'mails',
            queueOptions: {
              durable: false
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: ClientNames.USER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672')],
            queue: 'user_queue',
            queueOptions: {
              durable: true
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: ClientNames.PAYMENT_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            producer: {
              allowAutoTopicCreation: configService.get<boolean>('KAFKA_AUTO_CREATE_TOPICS', true),
            },
            subscribe: {
              fromBeginning: configService.get<boolean>('KAFKA_FROM_BEGINNING', true),
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: ClientNames.PRODUCTS_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672')],
            queue: 'product_queue',
            queueOptions: {
              durable: true
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),

  ],
  controllers: [AppController, UserController, ProductsController, AuthController],
  providers: [AppService, AuthService, JwtStrategy, PasswordStrategy],
})
export class AppModule {}
