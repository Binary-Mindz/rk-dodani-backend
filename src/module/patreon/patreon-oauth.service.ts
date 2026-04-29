import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PatreonOAuthService {
  private readonly authUrl = 'https://www.patreon.com/oauth2/authorize';
  private readonly tokenUrl = 'https://www.patreon.com/api/oauth2/token';
  private readonly identityUrl =
    'https://www.patreon.com/api/oauth2/v2/identity';

  getConnectUrl(userId: string) {
    const clientId = process.env.PATREON_CLIENT_ID;
    const redirectUri = process.env.PATREON_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new BadRequestException('Patreon env config missing');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'identity identity[email] identity.memberships',
      state: userId,
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string) {
    const clientId = process.env.PATREON_CLIENT_ID;
    const clientSecret = process.env.PATREON_CLIENT_SECRET;
    const redirectUri = process.env.PATREON_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Patreon env config missing');
    }

    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      throw new BadRequestException(await res.text());
    }

    return res.json();
  }

  async fetchIdentity(accessToken: string) {
    const query = new URLSearchParams({
      include: 'memberships,memberships.currently_entitled_tiers',
      'fields[user]': 'email,full_name,image_url,vanity',
      'fields[member]':
        'full_name,patron_status,last_charge_status,currently_entitled_amount_cents',
      'fields[tier]': 'title,amount_cents',
    });

    const res = await fetch(`${this.identityUrl}?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new BadRequestException(await res.text());
    }

    return res.json();
  }

  async refreshToken(refreshToken: string) {
    const clientId = process.env.PATREON_CLIENT_ID;
    const clientSecret = process.env.PATREON_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Patreon env config missing');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      throw new BadRequestException(await res.text());
    }

    return res.json();
  }
}