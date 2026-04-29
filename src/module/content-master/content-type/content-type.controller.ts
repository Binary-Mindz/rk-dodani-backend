import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentTypeService } from './content-type.service';

@ApiTags('Content Types')
@Controller('content-types')
export class ContentTypeController {
  constructor(private readonly service: ContentTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all content types' })
  async getAll() {
    const data = await this.service.getAll();

    return {
      statusCode: 200,
      message: 'Content types fetched successfully',
      data,
    };
  }
}