import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBookingDto } from './bookings.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto, @Req() req: { user: { id: number } }) {
    return this.bookings.create(req.user.id, dto.showtimeId, dto.method);
  }

  @Get()
  list(@Req() req: { user: { id: number } }) {
    return this.bookings.list(req.user.id);
  }
}