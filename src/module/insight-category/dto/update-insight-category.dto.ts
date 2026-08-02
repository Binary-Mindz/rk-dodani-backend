import { PartialType } from '@nestjs/swagger';
import { CreateInsightCategoryDto } from './create-insight-category.dto';

export class UpdateInsightCategoryDto extends PartialType(CreateInsightCategoryDto) {}
