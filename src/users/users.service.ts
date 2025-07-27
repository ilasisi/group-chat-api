import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.config';
import { Profile } from 'src/auth/auth.dto';

@Injectable()
export class UsersService {
  async getAllUsers(currentUserId: string) {
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (conversationsError) {
      throw new Error(conversationsError.message);
    }

    const conversationIds = conversations.map(
      (c) => c.conversation_id as string,
    );

    if (conversationIds.length === 0) {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .neq('id', currentUserId);

      if (error) throw new Error(error.message);
      return users;
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds);

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    const conversationIdsWithMessages = [
      ...new Set(messages.map((m) => m.conversation_id as string)),
    ];

    if (conversationIdsWithMessages.length === 0) {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .neq('id', currentUserId);

      if (error) throw new Error(error.message);
      return users;
    }

    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .in('conversation_id', conversationIdsWithMessages)
      .neq('user_id', currentUserId);

    if (participantsError) {
      throw new Error(participantsError.message);
    }

    const userIdsInConversation = [
      ...new Set(participants.map((p) => p.user_id as string)),
    ];

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .neq('id', currentUserId)
      .not(
        'id',
        'in',
        userIdsInConversation.length > 0
          ? `(${userIdsInConversation.join(',')})`
          : '(NULL)',
      );

    if (usersError) {
      throw new Error(usersError.message);
    }

    return users;
  }

  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single<Profile>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
