import { Controller, Get, Inject } from '@nestjs/common';
// import { AppService } from './app.service';
import { ClientNames } from './client.names';
import { ClientProxy, ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class ApiController {
  constructor(
    // private readonly appService: AppService,
    @Inject(ClientNames.MAIL_SERVICE) private readonly mailService: ClientProxy,
    @Inject(ClientNames.PAYMENT_SERVICE) private readonly paymentService: ClientKafka,
  ) {}

  @Get("send-email")
  getData() {
    const params = {
      mailList: ['aerapa12@yahoo.com'],
      subject: 'Test Email from Our System',
      template: './test-template',
      context: {
        title: 'Test Email',
        message: 'This is a test email sent from our NestJS application.',
        type: 'info',
        sentAt: new Date().toLocaleString(),
        year: new Date().getFullYear(),
      },
    }
    this.mailService.emit("send", params);
    return {
      success: true,
      message: 'Email send request dispatched',
      recipients: params.mailList,
      templateData: params.context,
    }
  }

  @Get("balance")
  getBalance() {
    this.paymentService.subscribeToResponseOf('getBalance');
    const result = firstValueFrom(this.paymentService.send('getBalance', {}));
    return result;
  }
}
