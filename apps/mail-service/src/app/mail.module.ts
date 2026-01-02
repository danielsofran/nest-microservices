import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from './config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

const configModule = ConfigModule.forRoot({
  isGlobal: true,
  expandVariables: true,
  envFilePath: [".env"],
  load: [config],
})

@Module({
  imports: [configModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>("mail.host"),
          port: configService.get<number>("mail.port"),
          secure: configService.get<boolean>("mail.secure"),
          auth: {
            user: configService.get<string>("mail.user"),
            pass: configService.get<string>("mail.pass"),
          },
        },
        defaults: {
          from: configService.get<string>("mail.from"),
        },
        template: {
          dir: __dirname + "/assets/templates/email", // Path to your EJS templates
          adapter: new EjsAdapter({
            inlineCssEnabled: true, // Optional: enable inline CSS
          }),
          options: {
            strict: false, // EJS doesn't need strict mode
          },
        },
        preview: process.env.NODE_ENV === "dev", // The preview opens a browser tab to display the email content during development, instead of actually sending the email.
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
