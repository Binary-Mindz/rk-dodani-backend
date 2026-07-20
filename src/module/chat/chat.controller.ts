import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddConversationMemberDto } from './dto/add-conversation-member.dto';
import { BlockConversationMemberDto } from './dto/block-conversation-member.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { RolesGuard } from 'common/guards/roles.guard';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBody({ type: CreateConversationDto })
  async createConversation(
    @CurrentUser('id') userId: string,
    @Body() data: CreateConversationDto,
  ) {
    try {
      return await this.chatService.createConversation(userId, data);
    } catch (error) {
      this.logger.error(
        `Failed to create conversation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('team/conversations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ENTERPRISE)
  @ApiOperation({ summary: 'Create a team conversation' })
  @ApiBody({ type: CreateConversationDto })
  async createTeamConversation(
    @CurrentUser('id') userId: string,
    @Body() data: CreateConversationDto,
  ) {
    try {
      return await this.chatService.createTeamConversation(userId, data);
    } catch (error) {
      this.logger.error(
        `Failed to create team conversation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('conversations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all conversations for current user' })
  async getConversations(@CurrentUser('id') userId: string) {
    try {
      return await this.chatService.getConversations(userId);
    } catch (error) {
      this.logger.error(
        `Failed to fetch conversations: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('conversations/:id/messages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get messages for a conversation' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    try {
      return await this.chatService.getMessages(
        id,
        userId,
        skip ? parseInt(skip) : 0,
        take ? parseInt(take) : 50,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch messages: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('conversations/:id/members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get members of a conversation (to debug access issues)',
  })
  async getMembers(@CurrentUser('id') userId: string, @Param('id') id: string) {
    try {
      return await this.chatService.getConversationMembers(id, userId);
    } catch (error) {
      this.logger.error(
        `Failed to fetch members: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('conversations/:id/members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a member to a normal conversation' })
  @ApiBody({ type: AddConversationMemberDto })
  async addMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() data: AddConversationMemberDto,
  ) {
    try {
      return await this.chatService.addConversationMember(
        id,
        userId,
        data.userId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add conversation member: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('team/conversations/:id/members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ENTERPRISE)
  @ApiOperation({ summary: 'Add a team member to a team conversation' })
  @ApiBody({ type: AddConversationMemberDto })
  async addTeamMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() data: AddConversationMemberDto,
  ) {
    try {
      return await this.chatService.addTeamConversationMember(
        id,
        userId,
        data.userId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add team conversation member: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('conversations/:id/members/:memberUserId/block')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Block a member in a normal conversation' })
  @ApiBody({ type: BlockConversationMemberDto, required: false })
  async blockMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
    @Body() data: BlockConversationMemberDto,
  ) {
    try {
      return await this.chatService.blockConversationMember(
        id,
        userId,
        memberUserId,
        data?.reason,
      );
    } catch (error) {
      this.logger.error(
        `Failed to block conversation member: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('conversations/:id/members/:memberUserId/unblock')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unblock a member in a normal conversation' })
  async unblockMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    try {
      return await this.chatService.unblockConversationMember(
        id,
        userId,
        memberUserId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to unblock conversation member: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('team/conversations/:id/members/:memberUserId/block')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ENTERPRISE)
  @ApiOperation({ summary: 'Block a member in a team conversation' })
  @ApiBody({ type: BlockConversationMemberDto, required: false })
  async blockTeamMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
    @Body() data: BlockConversationMemberDto,
  ) {
    try {
      return await this.chatService.blockTeamConversationMember(
        id,
        userId,
        memberUserId,
        data?.reason,
      );
    } catch (error) {
      this.logger.error(
        `Failed to block team conversation member: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('team/conversations/:id/members/:memberUserId/unblock')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ENTERPRISE)
  @ApiOperation({ summary: 'Unblock a member in a team conversation' })
  async unblockTeamMember(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    try {
      return await this.chatService.unblockTeamConversationMember(
        id,
        userId,
        memberUserId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to unblock team conversation member: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
