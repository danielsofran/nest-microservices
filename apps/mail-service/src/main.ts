/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailModule } from './app/mail.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  // First create the app
  const app = await NestFactory.create(MailModule);

  // Then create microservice with config port
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
      queue: 'mails',
      queueOptions: {
        durable: false
      },
    }
  });

  await app.startAllMicroservices()
  Logger.log(
    `🚀 Application Mail microservice is running`
  );
}

bootstrap();
