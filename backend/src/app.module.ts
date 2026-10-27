import { Module } from '@nestjs/common';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { CinemasModule } from './cinemas/cinemas.module';
import { SeatsModule } from './seats/seats.module';

// Each feature module (movies, bookings...) is added to this list
// as we build it.
@Module({
  imports: [DatabaseModule, AuthModule, MoviesModule, CinemasModule, SeatsModule],
})
export class AppModule {}