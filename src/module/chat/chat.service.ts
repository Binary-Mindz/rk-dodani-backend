import { Injectable, NotFoundException, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  async createConversation(userId: string, data: { name?: string; type: 'DIRECT' | 'GROUP'; participantIds: string[] }) {
    try {
      if (!data.participantIds || data.participantIds.length === 0) {
        throw new BadRequestException('At least one participant is required');
      }

      const members = [userId, ...data.participantIds].map(id => ({
        userId: id,
        role: id === userId ? ('OWNER' as const) : ('MEMBER' as const)
      }));

      return await this.prisma.conversation.create({
        data: {
          name: data.name,
          type: data.type,
          members: {
            create: members
          }
        },
        include: {
          members: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } }
          }
        }
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error creating conversation: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create conversation');
    }
  }

  async getConversations(userId: string) {
    try {
      return await this.prisma.conversation.findMany({
        where: {
          members: {
            some: { userId }
          }
        },
        include: {
          members: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error fetching conversations: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch conversations');
    }
  }

  async getMessages(conversationId: string, userId: string, skip: number = 0, take: number = 50) {
    try {
      const isMember = await this.prisma.conversationMember.findFirst({
        where: { conversationId, userId }
      });
      if (!isMember) {
        throw new NotFoundException('Conversation not found or access denied');
      }

      return await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          readReceipts: true
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching messages: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  async saveMessage(userId: string, conversationId: string, content: string) {
    try {
      const isMember = await this.prisma.conversationMember.findFirst({
        where: { conversationId: conversationId.trim(), userId: userId.trim() }
      });
      if (!isMember) {
        throw new NotFoundException(`Access Denied! User ID '${userId}' is NOT a member of Conversation ID '${conversationId}'. The creator of this conversation did not add this user.`);
      }

      return await this.prisma.message.create({
        data: {
          content,
          senderId: userId,
          conversationId: conversationId.trim(),
          readReceipts: {
            create: {
              userId
            }
          }
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          readReceipts: true
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error saving message: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to save message');
    }
  }

  async markAsRead(userId: string, messageId: string) {
    try {
      return await this.prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId
          }
        },
        create: {
          messageId,
          userId,
          readAt: new Date()
        },
        update: {
          readAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to mark message as read');
    }
  }

  async getConversationMembers(conversationId: string, userId: string) {
    try {
      // Security check: is the requesting user even in this conversation?
      const isMember = await this.prisma.conversationMember.findFirst({
        where: { conversationId, userId }
      });
      if (!isMember) {
        throw new NotFoundException('You do not have access to view members of this conversation.');
      }
      return await this.prisma.conversationMember.findMany({
        where: { conversationId },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } }
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching conversation members: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch conversation members');
    }
  }
}
