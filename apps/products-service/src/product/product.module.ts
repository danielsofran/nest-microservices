import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientNames } from '../client.names';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 9001),
        username: configService.get<string>('DB_USERNAME', 'admin'),
        password: configService.get<string>('DB_PASSWORD', 'admin'),
        database: configService.get<string>('DB_NAME', 'products_db'),
        entities: [Product],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Product]),
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
      ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
