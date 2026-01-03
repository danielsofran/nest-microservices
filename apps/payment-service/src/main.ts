/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
      queue: 'payment_queue_tmp',
      queueOptions: {
        durable: false,
      },
    },
  });
  await app.listen();
  Logger.log(
    `🚀 Application Products Service is running...`
  );
}

bootstrap();
