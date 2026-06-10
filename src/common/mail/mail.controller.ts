import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MailService } from './mail.service';
import { InquiryDto } from './dto/inquiry.dto';

@Controller('support')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleInquiry(@Body() inquiryDto: InquiryDto) {
   
    await this.mailService.sendInquiryToAdmin(inquiryDto);
    
    await this.mailService.sendInquiryConfirmationToUser(inquiryDto);

    return {
      success: true,
      message: 'Inquiry sent successfully to admin and confirmation sent to user!',
    };
  }
}