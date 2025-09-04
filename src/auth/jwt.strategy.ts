import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// JWT strategy to validate and attach user info from token to request
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Extract token from Authorization header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens
      ignoreExpiration: false,
      // Secret key used to verify JWT
      secretOrKey: configService.get<string>('JWT_SECRET') || 'jwt-secret-key',
    });

    // Token extraction and verification logic is handled by Passport (via super constructor)
  }

  // Called automatically after token is successfully verified
  // Returns the user info to be attached to request.user
  async validate(payload: any) {
    const user = { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role,
      id: payload.sub
    };
    console.log('JWT validated user:', user);
    return user;
  }
}

/**
 * 🔁 JWT Strategy Flow Recap:
 *
 * 1. @UseGuards(AuthGuard('jwt')) protects your route.
 * 2. Request comes in with a Bearer token.
 * 3. Passport (via super constructor) extracts & verifies the token (signature + expiry).
 * 4. If valid, Passport calls validate(payload).
 * 5. The returned object becomes request.user.
 */
