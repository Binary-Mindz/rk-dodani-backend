import { Module } from '@nestjs/common';
import { ContactInquiryController } from './contact-inquiry.controller';
import { ContactInquiryService } from './contact-inquiry.service';

@Module({
  controllers: [ContactInquiryController],
  providers: [ContactInquiryService],
  exports: [ContactInquiryService],
})
export class ContactInquiryModule {}