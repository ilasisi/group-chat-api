export interface RegisterDto {
  email: string;
  password: string;
  username: string;
  full_name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export interface User {
  user: { id: string };
}
