import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.config';
import {
  Conversation,
  ConversationParticipant,
  Message,
  SendMessageDto,
} from './chat.dto';
import { pusher } from 'src/config/pusher.config';
@Injectable()
export class ChatService {
  async getOrCreateConversation(
    userId1: string,
    userId2: string,
  ): Promise<string> {
    const { data: existingConversation } = await supabase
      .from('conversation_participants')
      .select(
        `
        conversation_id,
        conversations(*)
      `,
      )
      .eq('user_id', userId1);

    if (existingConversation) {
      for (const participant of existingConversation) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('*')
          .eq('conversation_id', participant.conversation_id)
          .eq('user_id', userId2)
          .single<ConversationParticipant>();

        if (otherParticipant) {
          return participant.conversation_id as string;
        }
      }
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single<Conversation>();

    if (conversationError || !conversation) {
      throw new Error(
        conversationError?.message || 'Failed to create conversation',
      );
    }

    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: userId1 },
        { conversation_id: conversation.id, user_id: userId2 },
      ]);

    if (participantError) {
      throw new Error(participantError.message);
    }

    return conversation.id;
  }

  async sendMessage(
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const { recipientId, content, messageType = 'text' } = sendMessageDto;
    const conversationId = await this.getOrCreateConversation(
      senderId,
      recipientId,
    );

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
      })
      .select(
        `
        *,
        sender:profiles(id, username, full_name, avatar_url)
      `,
      )
      .single<Message>();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to send message');
    }

    await this.sendRealTimeMessage(conversationId, data);

    return data;
  }

  async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(
        `
        conversation_id,
        conversations(
          id,
          created_at,
          updated_at
        )
      `,
      )
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    // Get the other participant and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      data.map(async (item) => {
        const conversationId = item.conversation_id as string;

        // Get other participant
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select(
            `
            user_id,
            profiles(id, username, full_name, avatar_url)
          `,
          )
          .eq('conversation_id', conversationId)
          .neq('user_id', userId)
          .single<ConversationParticipant>();

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single<Message>();

        return {
          ...item.conversations,
          other_participant: otherParticipant?.profiles,
          last_message: lastMessage,
        };
      }),
    );

    return conversationsWithDetails.filter(
      (conversation) => conversation.last_message !== null,
    );
  }

  async getMessages(
    userId: string,
    otherUserId: string,
    limit = 50,
    offset = 0,
  ): Promise<Message[]> {
    const conversationId = await this.getOrCreateConversation(
      userId,
      otherUserId,
    );

    const { data, error } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:profiles(id, username, full_name, avatar_url)
      `,
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      throw new Error(error?.message || 'Failed to fetch messages');
    }

    return data.reverse() as Message[];
  }

  private async sendRealTimeMessage(conversationId: string, message: any) {
    try {
      await pusher.trigger(`user-${conversationId}`, 'new-message', {
        message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to send real-time message:', error);
    }
  }

  async sendTypingIndicator(
    senderId: string,
    recipientId: string,
    isTyping: boolean,
  ) {
    try {
      await pusher.trigger(`private-user-${recipientId}`, 'typing-indicator', {
        senderId,
        isTyping,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }

  async sendOnlineStatus(userId: string, isOnline: boolean) {
    try {
      const conversations = await this.getConversations(userId);

      for (const conversation of conversations) {
        if (conversation.other_participant) {
          await pusher.trigger(
            `private-user-${conversation.other_participant.id}`,
            'user-status',
            {
              userId,
              isOnline,
              timestamp: new Date().toISOString(),
            },
          );
        }
      }
    } catch (error) {
      console.error('Failed to send online status:', error);
    }
  }
}
