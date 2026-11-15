import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
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
  stats(@Headers('x-admin-key') key: string, @Query('range') range?: string) {
    this.guard(key);
    return this.bookings.stats(range === 'today' || range === '7d' ? range : 'all');
  }

  @Get('halls')
  halls(@Headers('x-admin-key') key: string) {
    this.guard(key);
    return this.cinemas.listHalls();
  }

  @Get('movies')
  listMovies(@Headers('x-admin-key') key: string) {
    this.guard(key);
    return this.movies.adminList();
  }

  @Post('movies')
  createMovie(@Headers('x-admin-key') key: string, @Body() body: any) {
    this.guard(key);
    return this.movies.create(body ?? {});
  }

  @Patch('movies/:id/hidden')
  setHidden(@Headers('x-admin-key') key: string, @Param('id') id: string, @Body() body: any) {
    this.guard(key);
    return this.movies.setHidden(Number(id), Boolean(body?.hidden));
  }

  @Get('showtimes')
  listShowtimes(@Headers('x-admin-key') key: string, @Query('movieId') movieId?: string) {
    this.guard(key);
    return this.cinemas.adminShowtimes(Number(movieId));
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

  @Delete('showtimes/:id')
  deleteShowtime(@Headers('x-admin-key') key: string, @Param('id') id: string) {
    this.guard(key);
    return this.cinemas.deleteShowtime(Number(id));
  }
}