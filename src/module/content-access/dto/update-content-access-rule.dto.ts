import { PartialType } from '@nestjs/swagger';
import { CreateContentAccessRuleDto } from './create-content-access-rule.dto';

export class UpdateContentAccessRuleDto extends PartialType(
  CreateContentAccessRuleDto,
) {}