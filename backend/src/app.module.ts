import { Module } from '@nestjs/common';

// Each feature module (auth, movies, bookings...) is added to this list
// as we build it.
@Module({
  imports: [],
})
export class AppModule {}