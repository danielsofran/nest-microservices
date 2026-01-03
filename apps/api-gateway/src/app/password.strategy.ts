import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Strategy } from "passport-local"
import { PassportStrategy } from "@nestjs/passport"
import { AuthService } from "./auth.service"

@Injectable()
export class PasswordStrategy extends PassportStrategy(Strategy) {
  private logger: Logger = new Logger(PasswordStrategy.name)
  constructor(private authService: AuthService) {
    super({
      usernameField: "email",
      passwordField: "password",
      // TODO: not from request body, but from Authorization header
      passReqToCallback: true
    })
  }

  async validate(req: Request, username: string, password: string): Promise<any> {
    this.logger.log(`Validating user with email: ${username}, password: [PROTECTED]`, req.headers, req.credentials)

    // If you want to check Authorization header instead
    // @ts-ignore
    // const authHeader = req.headers['authorization'];
    // this.logger.log(`Authorization header: ${authHeader}`);
    // if (authHeader && authHeader.startsWith('Basic ')) {
    //   const base64Credentials = authHeader.split(' ')[1];
    //   const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    //   const [email, pass] = credentials.split(':');
    //   username = email;
    //   password = pass;
    // }

    const user = await this.authService.validateUser(username, password)
    this.logger.log("User validation result:", user)
    if (!user) {
      throw new UnauthorizedException({ error: "Invalid credentials" })
    }
    return user
  }
}