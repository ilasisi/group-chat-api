import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.config';
import { Profile } from 'src/auth/auth.dto';

@Injectable()
export class UsersService {
  async getAllUsers(currentUserId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .neq('id', currentUserId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
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
