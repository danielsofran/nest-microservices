import { Controller, Get, Logger, Query } from '@nestjs/common';
import * as mailService from './mail.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('mail')
export class MailController {
  private readonly logger = new Logger('MailController');
  // Hardcoded email list for testing
  private readonly hardcodedEmailList = ['aerapa12@yahoo.com'];

  constructor(private readonly mailService: mailService.MailService) {}

  @Get('send-test')
  async sendTestEmail(
    @Query('title') title?: string,
    @Query('message') message?: string,
    @Query('type') type?: 'info' | 'success' | 'warning' | 'error'
  ) {
    const emailParams = {
      mailList: this.hardcodedEmailList,
      subject: title || 'Test Email from Our System',
      template: './test-template',
      context: {
        title: title || 'Test Email',
        message:
          message || 'This is a test email sent from our NestJS application.',
        type: type || 'info',
        sentAt: new Date().toLocaleString(),
        year: new Date().getFullYear(),
      },
    };

    await this.mailService.sendEmail(emailParams);

    return {
      success: true,
      message: 'Test email sent successfully',
      recipients: this.hardcodedEmailList,
      templateData: emailParams.context,
    };
  }

  @EventPattern('send')
  async sendEmail(@Payload() emailParams: mailService.SendEmailParams) {
    try {
      await this.mailService.sendEmail(emailParams);
      this.logger.log("Emails sent successfully to: " + emailParams.mailList)
    } catch (error) {
      this.logger.error("Fail to send email", error);
    }
  }
}
