import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConversationType, TeamRole } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  async createConversation(
    userId: string,
    data: { name?: string; type: 'DIRECT' | 'GROUP'; participantIds: string[] },
  ) {
    try {
      if (!data.participantIds || data.participantIds.length === 0) {
        throw new BadRequestException('At least one participant is required');
      }

      const uniqueMemberIds = [...new Set([userId, ...data.participantIds])];

      // Check if creator & participant user IDs exist in DB
      const existingUsers = await this.prisma.user.findMany({
        where: { id: { in: uniqueMemberIds } },
        select: { id: true },
      });
      const existingUserIds = new Set(existingUsers.map((u) => u.id));
      const missingIds = uniqueMemberIds.filter(
        (id) => !existingUserIds.has(id),
      );
      if (missingIds.length > 0) {
        throw new BadRequestException(
          `User ID(s) not found in database: ${missingIds.join(', ')}`,
        );
      }

      const members = uniqueMemberIds.map((id) => ({
        userId: id,
        role: id === userId ? ('OWNER' as const) : ('MEMBER' as const),
      }));

      return await this.prisma.conversation.create({
        data: {
          name: data.name,
          type: data.type,
          createdBy: userId,
          members: {
            create: members,
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(
        `Error creating conversation: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to create conversation: ${error.message}`,
      );
    }
  }

  async createTeamConversation(
    userId: string,
    data: { name?: string; type: 'DIRECT' | 'GROUP'; participantIds: string[] },
  ) {
    try {
      if (!data.participantIds || data.participantIds.length === 0) {
        throw new BadRequestException('At least one participant is required');
      }

      await this.assertUsersBelongToSameTeam(userId, data.participantIds);

      return await this.createConversation(userId, data);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(
        `Error creating team conversation: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create team conversation',
      );
    }
  }

  async getConversations(userId: string) {
    try {
      return await this.prisma.conversation.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error fetching conversations: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch conversations');
    }
  }

  async getMessages(
    conversationId: string,
    userId: string,
    skip: number = 0,
    take: number = 50,
  ) {
    try {
      const isMember = await this.prisma.conversationMember.findFirst({
        where: { conversationId, userId, leftAt: null },
      });
      if (!isMember) {
        throw new NotFoundException('Conversation not found or access denied');
      }
      if (isMember.blockedAt) {
        throw new ForbiddenException('You are blocked from this conversation');
      }

      return await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          readReceipts: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error fetching messages: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  async getMessagesPaginated(
    conversationId: string,
    userId: string,
    skip: number = 0,
    take: number = 20,
    page?: number,
  ) {
    try {
      const isMember = await this.prisma.conversationMember.findFirst({
        where: { conversationId, userId, leftAt: null },
      });
      if (!isMember) {
        throw new NotFoundException('Conversation not found or access denied');
      }
      if (isMember.blockedAt) {
        throw new ForbiddenException('You are blocked from this conversation');
      }

      const [messages, total] = await this.prisma.$transaction([
        this.prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            readReceipts: true,
          },
        }),
        this.prisma.message.count({ where: { conversationId } }),
      ]);

      const currentPage = page ?? Math.floor(skip / take) + 1;
      const totalPages = Math.ceil(total / take);

      return {
        conversationId,
        messages,
        meta: {
          total,
          page: currentPage,
          limit: take,
          skip,
          take,
          totalPages,
          hasMore: skip + messages.length < total,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error(
        `Error fetching paginated messages: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  async saveMessage(userId: string, conversationId: string, content: string) {
    try {
      const isMember = await this.prisma.conversationMember.findFirst({
        where: {
          conversationId: conversationId.trim(),
          userId: userId.trim(),
          leftAt: null,
        },
      });
      if (!isMember) {
        throw new NotFoundException(
          `Access Denied! User ID '${userId}' is NOT a member of Conversation ID '${conversationId}'. The creator of this conversation did not add this user.`,
        );
      }
      if (isMember.blockedAt) {
        throw new ForbiddenException('You are blocked from this conversation');
      }

      return await this.prisma.message.create({
        data: {
          content,
          senderId: userId,
          conversationId: conversationId.trim(),
          readReceipts: {
            create: {
              userId,
            },
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          readReceipts: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error saving message: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to save message');
    }
  }

  async addConversationMember(
    conversationId: string,
    requesterId: string,
    memberUserId: string,
  ) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          members: true,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type !== ConversationType.GROUP) {
        throw new BadRequestException(
          'Members can only be added to group conversations',
        );
      }

      const requesterMembership = conversation.members.find(
        (member) => member.userId === requesterId && !member.leftAt,
      );

      if (!requesterMembership) {
        throw new NotFoundException('Conversation not found or access denied');
      }

      if (!['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
        throw new ForbiddenException(
          'Only a conversation owner or admin can add members',
        );
      }

      const existingMember = conversation.members.find(
        (member) => member.userId === memberUserId && !member.leftAt,
      );

      if (existingMember) {
        throw new ConflictException(
          'User is already a member of this conversation',
        );
      }

      await this.assertUsersExist([memberUserId]);

      return await this.prisma.conversationMember.create({
        data: {
          conversationId,
          userId: memberUserId,
          role: 'MEMBER',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Error adding conversation member: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to add conversation member',
      );
    }
  }

  async addTeamConversationMember(
    conversationId: string,
    requesterId: string,
    memberUserId: string,
  ) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          members: true,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type !== ConversationType.GROUP) {
        throw new BadRequestException(
          'Members can only be added to group conversations',
        );
      }

      const requesterMembership = conversation.members.find(
        (member) => member.userId === requesterId && !member.leftAt,
      );

      if (!requesterMembership) {
        throw new NotFoundException('Conversation not found or access denied');
      }

      const teamOwnerId = await this.assertConversationBelongsToRequesterTeam(
        conversation.members
          .filter((member) => !member.leftAt)
          .map((member) => member.userId),
        requesterId,
      );

      const canManageMembers = await this.canManageTeamChatMembers(
        requesterId,
        teamOwnerId,
      );
      if (!canManageMembers) {
        throw new ForbiddenException(
          'Only the team creator or a team admin can add members',
        );
      }

      await this.assertUsersBelongToSameTeam(requesterId, [memberUserId]);

      const existingMember = conversation.members.find(
        (member) => member.userId === memberUserId && !member.leftAt,
      );

      if (existingMember) {
        throw new ConflictException(
          'User is already a member of this conversation',
        );
      }

      return await this.prisma.conversationMember.create({
        data: {
          conversationId,
          userId: memberUserId,
          role: 'MEMBER',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Error adding team conversation member: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to add team conversation member',
      );
    }
  }

  async assertConversationMember(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });

    if (!member) {
      throw new NotFoundException('Conversation not found or access denied');
    }
    if (member.blockedAt) {
      throw new ForbiddenException('You are blocked from this conversation');
    }

    return member;
  }

  async blockConversationMember(
    conversationId: string,
    requesterId: string,
    memberUserId: string,
    reason?: string,
  ) {
    return this.setConversationMemberBlockState({
      conversationId,
      requesterId,
      memberUserId,
      isTeamConversation: false,
      block: true,
      reason,
    });
  }

  async unblockConversationMember(
    conversationId: string,
    requesterId: string,
    memberUserId: string,
  ) {
    return this.setConversationMemberBlockState({
      conversationId,
      requesterId,
      memberUserId,
      isTeamConversation: false,
      block: false,
    });
  }

  async blockTeamConversationMember(
    conversationId: string,
    requesterId: string,
    memberUserId: string,
    reason?: string,
  ) {
    return this.setConversationMemberBlockState({
      conversationId,
      requesterId,
      memberUserId,
      isTeamConversation: true,
      block: true,
      reason,
    });
  }

  async unblockTeamConversationMember(
    conversationId: string,
    requesterId: string,
    memberUserId: string,
  ) {
    return this.setConversationMemberBlockState({
      conversationId,
      requesterId,
      memberUserId,
      isTeamConversation: true,
      block: false,
    });
  }

  async markAsRead(userId: string, messageId: string) {
    try {
      return await this.prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
        create: {
          messageId,
          userId,
          readAt: new Date(),
        },
        update: {
          readAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error marking message as read: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to mark message as read');
    }
  }

  async getConversationMembers(conversationId: string, userId: string) {
    try {
      const isMember = await this.prisma.conversationMember.findFirst({
        where: { conversationId, userId, leftAt: null },
      });
      if (!isMember) {
        throw new NotFoundException(
          'You do not have access to view members of this conversation.',
        );
      }
      if (isMember.blockedAt) {
        throw new ForbiddenException('You are blocked from this conversation');
      }
      return await this.prisma.conversationMember.findMany({
        where: { conversationId },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error fetching conversation members: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch conversation members',
      );
    }
  }

  private async canManageTeamChatMembers(userId: string, teamOwnerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, parentUserId: true, teamRole: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return (
      user.id === teamOwnerId ||
      (user.parentUserId === teamOwnerId && user.teamRole === TeamRole.ADMIN)
    );
  }

  private async setConversationMemberBlockState(params: {
    conversationId: string;
    requesterId: string;
    memberUserId: string;
    isTeamConversation: boolean;
    block: boolean;
    reason?: string;
  }) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: params.conversationId },
        include: { members: true },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type !== ConversationType.GROUP) {
        throw new BadRequestException(
          'Members can only be blocked in group conversations',
        );
      }

      const requesterMembership = conversation.members.find(
        (member) => member.userId === params.requesterId && !member.leftAt,
      );
      if (!requesterMembership) {
        throw new NotFoundException('Conversation not found or access denied');
      }

      const targetMembership = conversation.members.find(
        (member) => member.userId === params.memberUserId && !member.leftAt,
      );
      if (!targetMembership) {
        throw new NotFoundException('Member not found in this conversation');
      }

      if (params.requesterId === params.memberUserId) {
        throw new BadRequestException('You cannot block yourself');
      }

      if (targetMembership.role === 'OWNER') {
        throw new ForbiddenException('Conversation owner cannot be blocked');
      }

      if (params.isTeamConversation) {
        const teamOwnerId = await this.assertConversationBelongsToRequesterTeam(
          conversation.members
            .filter((member) => !member.leftAt)
            .map((member) => member.userId),
          params.requesterId,
        );

        const canManageMembers = await this.canManageTeamChatMembers(
          params.requesterId,
          teamOwnerId,
        );

        if (!canManageMembers) {
          throw new ForbiddenException(
            'Only the team creator or a team admin can block or unblock members',
          );
        }
      } else if (!['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
        throw new ForbiddenException(
          'Only a conversation owner or admin can block or unblock members',
        );
      }

      return await this.prisma.conversationMember.update({
        where: { id: targetMembership.id },
        data: params.block
          ? {
              blockedAt: new Date(),
              blockedById: params.requesterId,
              blockReason: params.reason,
            }
          : {
              blockedAt: null,
              blockedById: null,
              blockReason: null,
            },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Error updating conversation member block state: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to update conversation member block state',
      );
    }
  }

  private async assertUsersBelongToSameTeam(
    requesterId: string,
    userIds: string[],
  ) {
    const uniqueUserIds = [...new Set([requesterId, ...userIds])];
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, parentUserId: true },
    });

    if (users.length !== uniqueUserIds.length) {
      throw new NotFoundException('One or more users were not found');
    }

    const requester = users.find((user) => user.id === requesterId);
    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const requesterTeamOwnerId = requester.parentUserId ?? requester.id;

    const outsideTeamUser = users.find((user) => {
      const teamOwnerId = user.parentUserId ?? user.id;
      return teamOwnerId !== requesterTeamOwnerId;
    });

    if (outsideTeamUser) {
      throw new BadRequestException(
        'All conversation members must belong to the same team',
      );
    }
  }

  private async assertUsersExist(userIds: string[]) {
    const uniqueUserIds = [...new Set(userIds)];
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true },
    });

    if (users.length !== uniqueUserIds.length) {
      throw new NotFoundException('One or more users were not found');
    }
  }

  private async assertConversationBelongsToRequesterTeam(
    conversationMemberIds: string[],
    requesterId: string,
  ) {
    const uniqueUserIds = [...new Set([requesterId, ...conversationMemberIds])];
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true, parentUserId: true },
    });

    if (users.length !== uniqueUserIds.length) {
      throw new NotFoundException(
        'One or more conversation members were not found',
      );
    }

    const requester = users.find((user) => user.id === requesterId);
    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const requesterTeamOwnerId = requester.parentUserId ?? requester.id;

    const hasOutsideTeamMember = users.some((user) => {
      const teamOwnerId = user.parentUserId ?? user.id;
      return teamOwnerId !== requesterTeamOwnerId;
    });

    if (hasOutsideTeamMember) {
      throw new ForbiddenException(
        'You cannot manage members for another team conversation',
      );
    }

    return requesterTeamOwnerId;
  }

  async ensureTeamConversation(ownerId: string, newMemberIds: string[]): Promise<void> {
    try {
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          type: 'GROUP',
          members: { some: { userId: ownerId, role: 'OWNER' } },
        },
        include: { members: { select: { userId: true } } },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            type: 'GROUP',
            members: { create: { userId: ownerId, role: 'OWNER' } },
          },
          include: { members: { select: { userId: true } } },
        });
      }

      const existingMemberIds = new Set(conversation.members.map((m) => m.userId));
      const toAdd = newMemberIds.filter((id) => !existingMemberIds.has(id));

      if (toAdd.length > 0) {
        await this.prisma.conversationMember.createMany({
          data: toAdd.map((userId) => ({
            conversationId: conversation!.id,
            userId,
            role: 'MEMBER' as const,
          })),
          skipDuplicates: true,
        });
      }
    } catch (error) {
      this.logger.error(`Error ensuring team conversation: ${error.message}`, error.stack);
    }
  }
}
