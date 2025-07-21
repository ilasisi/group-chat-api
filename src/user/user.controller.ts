import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string },
  ) {
    return await this.userService.register(
      body.email,
      body.password,
      body.name,
    );
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      return await this.userService.login(body.email, body.password);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('all')
  async listAllUsers() {
    return await this.userService.listAllUsers();
  }
}
