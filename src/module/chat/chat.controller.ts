import { Controller, Get, Post, Body, Param, UseGuards, Query, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';

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
    @Body() data: CreateConversationDto
  ) {
    try {
      return await this.chatService.createConversation(userId, data);
    } catch (error) {
      this.logger.error(`Failed to create conversation: ${error.message}`, error.stack);
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
      this.logger.error(`Failed to fetch conversations: ${error.message}`, error.stack);
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
    @Query('take') take?: string
  ) {
    try {
      return await this.chatService.getMessages(id, userId, skip ? parseInt(skip) : 0, take ? parseInt(take) : 50);
    } catch (error) {
      this.logger.error(`Failed to fetch messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('conversations/:id/members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get members of a conversation (to debug access issues)' })
  async getMembers(@CurrentUser('id') userId: string, @Param('id') id: string) {
    try {
      return await this.chatService.getConversationMembers(id, userId);
    } catch (error) {
      this.logger.error(`Failed to fetch members: ${error.message}`, error.stack);
      throw error;
    }
  }
}
