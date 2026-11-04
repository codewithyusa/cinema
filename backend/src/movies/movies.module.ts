import { Module } from '@nestjs/common';
import { ComingSoonController } from './coming-soon.controller';
import { ComingSoonService } from './coming-soon.service';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

@Module({
  controllers: [MoviesController, ReviewsController, WatchlistController, ComingSoonController],
  providers: [MoviesService, ReviewsService, WatchlistService, ComingSoonService],
})
export class MoviesModule {}