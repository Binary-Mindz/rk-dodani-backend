import { PartialType } from '@nestjs/swagger';
import { CreateContentAssetDto } from './create-content-asset.dto';

export class UpdateContentAssetDto extends PartialType(CreateContentAssetDto) {}