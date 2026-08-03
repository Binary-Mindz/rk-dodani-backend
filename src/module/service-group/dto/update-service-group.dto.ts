import { PartialType } from '@nestjs/swagger';
import { CreateServiceGroupDto } from './create-service-group.dto';

export class UpdateServiceGroupDto extends PartialType(CreateServiceGroupDto) {}
