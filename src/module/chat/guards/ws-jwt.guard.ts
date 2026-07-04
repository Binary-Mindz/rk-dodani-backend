import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from 'common/interfaces/jwt-payload.interface';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        throw new WsException('Unauthorized access');
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload: JwtPayload = this.jwtService.verify(token, { secret });
      
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };

      return true;
    } catch (err) {
      this.logger.error(`WsJwtGuard failed: ${err.message}`);
      throw new WsException('Unauthorized access');
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken.replace('Bearer ', '');
    }
    return null;
  }
}
