/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailModule } from './app/mail.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // First create the app
  const app = await NestFactory.create(MailModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Get port from config
  const port = configService.get<number>('server.port', 7001);

  // Then create microservice with config port
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:admin@localhost:' + 5672],
      queue: 'mails',
      queueOptions: {
        durable: false
      },
    }
  });

  await app.startAllMicroservices()
  Logger.log(
    `🚀 Application Mail microservice is running on port ${port}`
  );
}

bootstrap();
