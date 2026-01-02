import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer"
import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

export interface SendEmailParams {
  mailList: string[]
  subject: string
  template: string
  context?: ISendMailOptions["context"]
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {}

  async sendEmail(params: SendEmailParams) {
    try {
      const sendMailParams = {
        to: params.mailList,
        from: this.configService.get<string>("mail.from"),
        subject: params.subject,
        template: params.template,
        context: params.context || {},
      }
      const response = await this.mailerService.sendMail(sendMailParams)
      this.logger.log(
        `Email sent successfully to recipients with the following parameters : ${JSON.stringify(
          sendMailParams
        )}`,
        response
      )
    } catch (error) {
      this.logger.error(
        `Error while sending mail with the following parameters : ${JSON.stringify(
          params
        )}`,
        error
      )
    }
  }
}

