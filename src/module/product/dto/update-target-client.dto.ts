import { PartialType } from '@nestjs/swagger';
import { CreateTargetClientDto } from './create-target-client.dto';

export class UpdateTargetClientDto extends PartialType(CreateTargetClientDto) {}
