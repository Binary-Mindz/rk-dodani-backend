import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { CurrentUserData } from 'common/interfaces/current-user.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: true })
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.emit('error', 'Unauthorized');
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      client.data.user = { id: payload.sub, email: payload.email, roles: payload.roles ?? [] };
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.emit('error', 'Unauthorized');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1];
    const token = client.handshake.auth?.token;
    return token ? token.replace('Bearer ', '') : null;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody('conversationId') conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user: CurrentUserData = client.data.user;
      if (!user || !conversationId) {
        return { event: 'error', message: 'Invalid payload' };
      }

      await this.chatService.assertConversationMember(conversationId, user.id);
      client.join(conversationId);
      return { event: 'joinedRoom', data: conversationId };
    } catch (error) {
      this.logger.error(
        `Error joining room ${conversationId}: ${error.message}`,
      );
      return {
        event: 'error',
        message: error.message || 'Failed to join room',
      };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user: CurrentUserData = client.data.user;
      if (user && data.conversationId) {
        client.to(data.conversationId).emit('typingIndicator', {
          userId: user.id,
          isTyping: data.isTyping,
        });
      }
    } catch (error) {
      this.logger.error(`Error emitting typing indicator: ${error.message}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user: CurrentUserData = client.data.user;
      if (user && data.conversationId && data.content) {
        const message = await this.chatService.saveMessage(
          user.id,
          data.conversationId,
          data.content,
        );
        this.server.to(data.conversationId).emit('newMessage', message);
        return { status: 'ok', data: message };
      }
      return { status: 'error', message: 'Invalid payload' };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      return {
        status: 'error',
        message: error.message || 'Failed to send message',
      };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user: CurrentUserData = client.data.user;
      if (user && data.messageId && data.conversationId) {
        await this.chatService.markAsRead(user.id, data.messageId);
        // Notify the room that a message was read
        this.server.to(data.conversationId).emit('messageRead', {
          messageId: data.messageId,
          userId: user.id,
          readAt: new Date(),
        });
        return { status: 'ok' };
      }
      return { status: 'error', message: 'Invalid payload' };
    } catch (error) {
      this.logger.error(`Error marking as read: ${error.message}`, error.stack);
      return {
        status: 'error',
        message: error.message || 'Failed to mark as read',
      };
    }
  }
}
