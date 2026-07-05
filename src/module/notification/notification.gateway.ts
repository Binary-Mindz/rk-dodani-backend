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

@WebSocketGateway({ namespace: '/notifications', cors: true })
@UseGuards(WsJwtGuard)
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    const user: CurrentUserData = client.data.user;
    if (user?.id) {
      client.join(`user:${user.id}`);
      this.logger.log(`User ${user.id} connected to notifications`);
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
}
