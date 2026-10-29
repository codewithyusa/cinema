import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBookingDto, QuoteDto } from './bookings.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post('quote')
  quote(@Body() dto: QuoteDto, @Req() req: { user: { id: number } }) {
    return this.bookings.quote(req.user.id, dto);
  }

  @Post()
  create(@Body() dto: CreateBookingDto, @Req() req: { user: { id: number } }) {
    return this.bookings.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: { user: { id: number } }) {
    return this.bookings.list(req.user.id);
  }

  @Delete(':code')
  cancel(@Param('code') code: string, @Req() req: { user: { id: number } }) {
    return this.bookings.cancel(req.user.id, code);
  }
}