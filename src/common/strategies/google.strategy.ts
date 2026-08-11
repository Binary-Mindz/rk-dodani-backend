import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

export type GoogleOAuthProfile = {
  providerUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  rawProfile: Profile;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google profile email missing'), false);
    }

    const normalizedProfile: GoogleOAuthProfile = {
      providerUserId: profile.id,
      email: email.trim().toLowerCase(),
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
      rawProfile: profile,
    };

    return done(null, normalizedProfile);
  }
}
