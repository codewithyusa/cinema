import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HoldSeatsDto } from './seats.dto';
import { SeatsService } from './seats.service';

@Controller('showtimes')
@UseGuards(JwtAuthGuard)
export class SeatsController {
  constructor(private readonly seats: SeatsService) {}

  @Get(':id/seats')
  list(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { id: number } }) {
    return this.seats.list(id, req.user.id);
  }

  @Post(':id/seats/hold')
  hold(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HoldSeatsDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.seats.hold(id, req.user.id, dto.seats);
  }

  @Delete(':id/seats/hold')
  release(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { id: number } }) {
    return this.seats.release(id, req.user.id);
  }
}