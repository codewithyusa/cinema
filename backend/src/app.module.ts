import { Module } from '@nestjs/common';
import { DatabaseModule } from './db/database.module';

// Each feature module (auth, movies, bookings...) is added to this list
// as we build it.
@Module({
  imports: [DatabaseModule],
})
export class AppModule {}