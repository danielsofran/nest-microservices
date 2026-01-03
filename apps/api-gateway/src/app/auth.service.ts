import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClientNames } from './client.names';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger(AuthService.name);

  constructor(
    @Inject(ClientNames.USER_SERVICE)
    private userService: ClientProxy
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      this.logger.log(`Attempting to validate user with email: ${email}`);

      // Add timeout and error handling to the observable
      const user = await firstValueFrom(
        this.userService.send('findOneByEmail', email).pipe(
          catchError(error => {
            this.logger.error(`Microservice communication error: ${error.message}`, error.stack);
            throw new Error(`User service unavailable: ${error.message}`);
          })
        )
      );

      if (!user) {
        this.logger.warn(`No user found with email: ${email}`);
        return null;
      }

      this.logger.log(`User found with email: ${email}`);

      // Check if user has a password property
      if (!user.password) {
        this.logger.warn(`User ${email} has no password set`);
        return null;
      }

      // TODO: Replace with proper password hashing comparison
      // In production, use: await bcrypt.compare(pass, user.password)
      if (user.password === pass) {
        const { password, ...result } = user;
        this.logger.log(`User ${email} authenticated successfully`);
        return result;
      }

      this.logger.warn(`Invalid password for user: ${email}`);
      return null;

    } catch (error: any) {
      // Handle specific microservice errors
      if (error.message.includes('no matching message handler')) {
        this.logger.error(`User service doesn't have 'findOneByEmail' handler`, error.stack);
        throw new Error('Authentication service configuration error: Missing user service handler');
      }

      if (error.message.includes('ECONNREFUSED') || error.message.includes('RMQ connection error')) {
        this.logger.error(`User service connection failed: ${error.message}`);
        throw new Error('Authentication service temporarily unavailable');
      }

      if (error.message.includes('timeout')) {
        this.logger.error(`User service timeout for email: ${email}`);
        throw new Error('Authentication request timeout');
      }

      this.logger.error(`Unexpected error validating user ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }
}