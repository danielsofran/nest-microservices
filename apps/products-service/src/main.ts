/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ProductModule } from './product/product.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ProductModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
      queue: 'product_queue',
      queueOptions: {
        durable: true,
      },
    },
  });
  await app.listen();
  Logger.log(
    `🚀 Application Products Service is running...`
  );
}

bootstrap();
