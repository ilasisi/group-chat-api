import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Profile } from 'src/auth/auth.dto';

export class SendMessageDtoValidated implements SendMessageDto {
  @IsUUID()
  recipientId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  messageType?: string;
}

export class TypingIndicatorDto {
  @IsUUID()
  recipientId: string;

  @IsBoolean()
  isTyping: boolean;
}

export interface SendMessageDto {
  recipientId: string;
  content: string;
  messageType?: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  profiles: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  sender?: Profile;
}
