import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [MoviesController, ReviewsController],
  providers: [MoviesService, ReviewsService],
})
export class MoviesModule {}