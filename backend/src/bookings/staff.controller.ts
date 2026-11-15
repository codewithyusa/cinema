import { Controller, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('staff')
export class StaffController {
  constructor(private readonly bookings: BookingsService) {}

  @Post('verify/:code')
  verify(@Headers('x-staff-key') key: string, @Param('code') code: string) {
    if (!process.env.STAFF_KEY || key !== process.env.STAFF_KEY) {
      throw new UnauthorizedException('Staff key required.');
    }
    return this.bookings.verify(code);
  }
}