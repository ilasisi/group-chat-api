import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

@Injectable()
export class UserService {
  async register(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error;

    if (!data.user) throw new Error('User not found');

    const { error: profileError }: { error: any } = await supabase
      .from('profiles')
      .insert([{ user_id: data.user.id, name }]);

    if (profileError) throw profileError;

    return {
      id: data.user.id,
      email: data.user.email,
      name,
    };
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user) throw new Error('User not found');

    const {
      data: profile,
      error: profileError,
    }: { data: { name: string } | null; error: any } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', data.user.id)
      .single();
    if (profileError) throw profileError;

    return {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name ?? null,
      access_token: data.session?.access_token,
    };
  }

  async listAllUsers() {
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name');
    if (profilesError) throw profilesError;

    const profileMap = new Map<string, string>();

    for (const profile of profiles ?? []) {
      profileMap.set(profile.user_id, profile.name);
    }

    type SupabaseUser = { id: string; email?: string };

    return (users?.users ?? []).map((user: SupabaseUser) => ({
      id: user.id,
      email: user.email ?? null,
      name: profileMap.get(user.id) ?? null,
    }));
  }
}
