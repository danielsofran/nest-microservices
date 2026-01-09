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
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'nestjs-group-client',
      },
      // Add these options
      // subscribe: {
      //   fromBeginning: true,
      // },
      producer: {
        allowAutoTopicCreation: true, // Allow topic creation
      },
      // Configure reply patterns
      run: {
        autoCommit: false,
      },
    },
  });
  await app.listen();
  Logger.log(
    `🚀 Application Payment Service is running...`
  );
}

bootstrap();
