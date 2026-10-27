import { BadRequestException, Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CinemasService } from './cinemas.service';

// Turns an optional query value like "2" into 2. Empty stays undefined.
function toOptionalId(value: string | undefined, name: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${name} must be a positive whole number.`);
  }
  return n;
}

@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly cinemas: CinemasService) {}

  @Get()
  list(@Query('movieId') movieId?: string, @Query('cinemaId') cinemaId?: string) {
    return this.cinemas.listShowtimes(
      toOptionalId(movieId, 'movieId'),
      toOptionalId(cinemaId, 'cinemaId'),
    );
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.cinemas.getShowtime(id);
  }
}