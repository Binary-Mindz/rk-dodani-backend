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
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRoleCode } from '@prisma/client';
import { RolesGuard } from 'common/guards/roles.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Tags')
@Controller()
export class TagController {
  constructor(private readonly service: TagService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Post('admin/tags')
  @ApiOperation({ summary: 'Create tag' })
  async create(@Body() dto: CreateTagDto) {
    const data = await this.service.create(dto);

    return {
      statusCode: 201,
      message: 'Tag created successfully',
      data,
    };
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags' })
  async findAll(@Query() query: QueryTagDto) {
    const data = await this.service.findAll(query);

    return {
      statusCode: 200,
      message: 'Tags fetched successfully',
      data,
    };
  }

  @Get('tags/:id')
  @ApiOperation({ summary: 'Get tag details' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);

    return {
      statusCode: 200,
      message: 'Tag fetched successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Patch('admin/tags/:id')
  @ApiOperation({ summary: 'Update tag' })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    const data = await this.service.update(id, dto);

    return {
      statusCode: 200,
      message: 'Tag updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.EDITOR)
  @Delete('admin/tags/:id')
  @ApiOperation({ summary: 'Delete tag' })
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id);

    return {
      statusCode: 200,
      message: 'Tag deleted successfully',
      data,
    };
  }
}