import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { PasswordGuard } from './password.guard';

@Controller("auth")
export class AuthController {
  @UseGuards(PasswordGuard)
  @Post("login/password")
  async login(@Request() req: any): Promise<any> {
    try {
      return req.user
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  @Post("logout")
  async logout(@Request() req: any): Promise<any> {
    if (req.user) {
      req.logout()
    }
  }
}
