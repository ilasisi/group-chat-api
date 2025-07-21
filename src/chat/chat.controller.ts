import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body() body: { content: string; from: string; to: string },
  ): Promise<any> {
    return await this.chatService.sendMessage(body.from, body.to, body.content);
  }

  @Get('messages/:from/:to')
  async getMessages(
    @Param('from') from: string,
    @Param('to') to: string,
  ): Promise<any[]> {
    return await this.chatService.getMessagesBetweenUsers(from, to);
  }
}
