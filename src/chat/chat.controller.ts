import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDtoValidated } from './chat.dto';
import { User } from 'src/auth/auth.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('send')
  async sendMessage(
    @Request() req: User,
    @Body(ValidationPipe) sendMessageDto: SendMessageDtoValidated,
  ) {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Get('conversations')
  async getConversations(@Request() req: User) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('messages/:otherUserId')
  async getMessages(
    @Request() req: User,
    @Param('otherUserId') otherUserId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.getMessages(
      req.user.id,
      otherUserId,
      limit || 50,
      offset || 0,
    );
  }
}
