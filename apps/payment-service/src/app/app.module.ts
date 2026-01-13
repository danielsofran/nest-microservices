import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { StripeService } from './stripe.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductStripeService } from './product.stripe.service';
import { UserStripeService } from './user.stripe.service';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env', '.private.env'],
    })
  ],
  controllers: [PaymentController],
  providers: [
    StripeService, ProductStripeService, UserStripeService, PaymentService,
    {
      provide: 'STRIPE_API_KEY',
      useFactory: async (configService: ConfigService) =>
        configService.get<string>('STRIPE_KEY'),
      inject: [ConfigService],
    }
  ],
})
export class AppModule {}
