import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

@Injectable()
export class ChatService {
  async sendMessage(from: string, to: string, content: string): Promise<any> {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ from, to, content }]);
    if (error) throw error;
    return data;
  }

  async getMessages(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`from.eq.${userId},to.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getMessagesBetweenUsers(
    userId1: string,
    userId2: string,
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`from.eq.${userId1},from.eq.${userId2}`)
      .or(`to.eq.${userId1},to.eq.${userId2}`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }
}
