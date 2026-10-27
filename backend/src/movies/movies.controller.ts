import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get()
  list(@Query('genre') genre?: string) {
    return this.movies.list(genre);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.movies.get(id);
  }
}