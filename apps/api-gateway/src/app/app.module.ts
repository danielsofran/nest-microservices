import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientNames } from './client.names';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ClientNames.MAIL_SERVICE,
        transport: Transport.TCP,
        options: {
          port: 7001,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
