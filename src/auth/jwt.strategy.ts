import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    const secret = process.env.SUPABASE_JWT_SECRET;

    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    try {
      const user = await this.authService.validateToken(token ?? '');
      return user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
