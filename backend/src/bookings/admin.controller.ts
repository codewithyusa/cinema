import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { CinemasService } from '../cinemas/cinemas.service';
import { MoviesService } from '../movies/movies.service';
import { BookingsService } from './bookings.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly movies: MoviesService,
    private readonly cinemas: CinemasService,
  ) {}

  private guard(key?: string) {
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
      throw new UnauthorizedException('Admin key required.');
    }
  }

  @Get('stats')
  stats(@Headers('x-admin-key') key: string) {
    this.guard(key);
    return this.bookings.stats();
  }

  @Get('halls')
  halls(@Headers('x-admin-key') key: string) {
    this.guard(key);
    return this.cinemas.listHalls();
  }

  @Post('movies')
  createMovie(@Headers('x-admin-key') key: string, @Body() body: any) {
    this.guard(key);
    return this.movies.create(body ?? {});
  }

  @Post('showtimes')
  createShowtime(@Headers('x-admin-key') key: string, @Body() body: any) {
    this.guard(key);
    return this.cinemas.createShowtime(
      Number(body?.movieId),
      Number(body?.hallId),
      String(body?.date ?? ''),
      String(body?.time ?? ''),
      Number(body?.priceEtb),
    );
  }
}