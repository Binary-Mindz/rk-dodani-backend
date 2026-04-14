import { Module } from '@nestjs/common';
import { ContentTypeModule } from './content-type/content-type.module';
import { CategoryModule } from './category/category.module';
import { TagModule } from './tag/tag.module';


@Module({
  imports: [ContentTypeModule, CategoryModule, TagModule],
  exports: [ContentTypeModule, CategoryModule, TagModule],
})
export class ContentMasterModule {}