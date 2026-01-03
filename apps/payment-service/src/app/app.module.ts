import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StripeService } from './stripe.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductService } from './product.service';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env', '.private.env'],
    })
  ],
  controllers: [AppController],
  providers: [
    StripeService, ProductService, UserService,
    {
      provide: 'STRIPE_API_KEY',
      useFactory: async (configService: ConfigService) =>
        configService.get<string>('STRIPE_KEY'),
      inject: [ConfigService],
    }
  ],
})
export class AppModule {}
