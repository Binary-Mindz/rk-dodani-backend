import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentAccessService } from './content-access.service';
import { CreateContentAccessRuleDto } from './dto/create-content-access-rule.dto';
import { UpdateContentAccessRuleDto } from './dto/update-content-access-rule.dto';
import { QueryContentAccessRuleDto } from './dto/query-content-access-rule.dto';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';


@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Content Access')
@Controller()
export class ContentAccessController {
  constructor(private readonly service: ContentAccessService) {}

  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Post('admin/content-access-rules')
  @ApiOperation({ summary: 'Create content access rule' })
  async createRule(@Body() dto: CreateContentAccessRuleDto) {
    const data = await this.service.createRule(dto);

    return {
      statusCode: 201,
      message: 'Content access rule created successfully',
      data,
    };
  }

  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Get('admin/content-access-rules')
  @ApiOperation({ summary: 'Get content access rules' })
  async findRules(@Query() query: QueryContentAccessRuleDto) {
    const data = await this.service.findRules(query);

    return {
      statusCode: 200,
      message: 'Content access rules fetched successfully',
      data,
    };
  }

  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Get('admin/content-access-rules/:id')
  @ApiOperation({ summary: 'Get content access rule details' })
  async findRuleById(@Param('id') id: string) {
    const data = await this.service.findRuleById(id);

    return {
      statusCode: 200,
      message: 'Content access rule fetched successfully',
      data,
    };
  }

  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/content-access-rules/:id')
  @ApiOperation({ summary: 'Update content access rule' })
  async updateRule(
    @Param('id') id: string,
    @Body() dto: UpdateContentAccessRuleDto,
  ) {
    const data = await this.service.updateRule(id, dto);

    return {
      statusCode: 200,
      message: 'Content access rule updated successfully',
      data,
    };
  }

  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Delete('admin/content-access-rules/:id')
  @ApiOperation({ summary: 'Delete content access rule' })
  async removeRule(@Param('id') id: string) {
    const data = await this.service.removeRule(id);

    return {
      statusCode: 200,
      message: 'Content access rule deleted successfully',
      data,
    };
  }

  @Get('content/:slug/access-check')
  @ApiOperation({ summary: 'Check whether current user can access content' })
  async checkAccess(
    @Param('slug') slug: string,
     @CurrentUser('id') userId: string,
  ) {
    const data = await this.service.checkAccess(slug, userId);

    return {
      statusCode: 200,
      message: 'Content access evaluated successfully',
      data,
    };
  }

  @Get('content/:slug/protected')
  @ApiOperation({
    summary: 'Get protected content if current user has access',
  })
  async getAccessibleContent(
    @Param('slug') slug: string,
   @CurrentUser('id') userId: string,
  ) {
    const data = await this.service.getAccessibleContentBySlug(slug, userId)

    return {
      statusCode: 200,
      message: data.allowed
        ? 'Content fetched successfully'
        : 'Content access denied',
      data,
    };
  }
}