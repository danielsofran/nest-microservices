import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { PasswordGuard } from './password.guard';
import { AuthService } from './auth.service';

@Controller("auth")
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @UseGuards(PasswordGuard)
  @Post("login/password")
  async login(@Request() req: any): Promise<any> {
    // try {
    //   return req.user
    // } catch (error) {
    //   console.error("Login error:", error)
    //   throw error
    // }login/password
    return this.authService.login(req.user)
  }

  @Post("logout")
  async logout(@Request() req: any): Promise<any> {
    if (req.user) {
      req.logout()
    }
  }
}
