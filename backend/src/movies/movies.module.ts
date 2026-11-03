import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

@Module({
  controllers: [MoviesController, ReviewsController, WatchlistController],
  providers: [MoviesService, ReviewsService, WatchlistService],
})
export class MoviesModule {}