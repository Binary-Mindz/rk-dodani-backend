import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from 'module/chat/guards/ws-jwt.guard';
import { CurrentUserData } from 'common/interfaces/current-user.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'common/interfaces/jwt-payload.interface';

@WebSocketGateway({ namespace: '/notifications', cors: true })
@UseGuards(WsJwtGuard)
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        throw new Error('No token provided');
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload: JwtPayload = this.jwtService.verify(token, { secret });
      
      const user: CurrentUserData = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };
      
      client.data.user = user;
      client.join(`user:${user.id}`);
      this.logger.log(`User ${user.id} connected to notifications`);
    } catch (error) {
      this.logger.error(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user: CurrentUserData = client.data.user;
    this.logger.log(`User ${user?.id ?? client.id} disconnected from notifications`);
  }

  sendToUser(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  @SubscribeMessage('markRead')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
  ) {
    const user: CurrentUserData = client.data.user;
    this.logger.log(`User ${user?.id} acknowledged markRead via socket`);
    return { status: 'ok' };
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

