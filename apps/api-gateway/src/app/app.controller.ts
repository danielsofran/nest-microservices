import { Controller, Get, Inject } from '@nestjs/common';
// import { AppService } from './app.service';
import { ClientNames } from './client.names';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    // private readonly appService: AppService,
    @Inject(ClientNames.MAIL_SERVICE) private readonly mailService: ClientProxy,
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
}
