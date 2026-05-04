import {
  Controller,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PatreonService } from './patreon.service';
import { PatreonCallbackQueryDto } from './dto/patreon-callback-query.dto';
// import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@ApiTags('Patreon')
@Controller('patreon')
export class PatreonController {
  constructor(private readonly service: PatreonService) {}

  @Get('connect')
  @ApiOperation({ summary: 'Get Patreon connect URL' })
  async connect(
    // @CurrentUser() user: any,
  ) {
    const data = this.service.getConnectUrl('USER_ID_HERE');

    return {
      statusCode: 200,
      message: 'Patreon connect URL generated successfully',
      data,
    };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Patreon OAuth callback' })
  async callback(@Query() query: PatreonCallbackQueryDto) {
    const data = await this.service.handleCallback(query);

    return {
      statusCode: 200,
      message: 'Patreon connected successfully',
      data,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my Patreon status' })
  async me(
    // @CurrentUser() user: any,
  ) {
    const data = await this.service.getMyStatus('USER_ID_HERE');

    return {
      statusCode: 200,
      message: 'Patreon status fetched successfully',
      data,
    };
  }

  @Get('refresh')
  @ApiOperation({ summary: 'Refresh my Patreon status' })
  async refresh(
    // @CurrentUser() user: any,
  ) {
    const data = await this.service.refreshMyStatus('USER_ID_HERE');

    return {
      statusCode: 200,
      message: 'Patreon status refreshed successfully',
      data,
    };
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Disconnect Patreon' })
  async disconnect(
    // @CurrentUser() user: any,
  ) {
    const data = await this.service.disconnect('USER_ID_HERE');

    return {
      statusCode: 200,
      message: 'Patreon disconnected successfully',
      data,
    };
  }
}