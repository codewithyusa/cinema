import { Module } from '@nestjs/common';
import { CinemasModule } from '../cinemas/cinemas.module';
import { MoviesModule } from '../movies/movies.module';
import { AdminController } from './admin.controller';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [CinemasModule, MoviesModule],
  controllers: [BookingsController, StaffController, AdminController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}