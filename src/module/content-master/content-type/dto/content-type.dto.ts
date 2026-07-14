import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ContentTypeCode } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

// create content type
export class CreateContentTypeDto {

    @ApiProperty({ enum: ContentTypeCode, default: ContentTypeCode.PODCAST })
    @IsEnum(ContentTypeCode)
    code: ContentTypeCode;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    description: string;
}



// update content type
export class UpdateContentTypeDto extends PartialType(CreateContentTypeDto) { }

