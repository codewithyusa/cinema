import { Module } from '@nestjs/common';
import { CinemasModule } from '../cinemas/cinemas.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [CinemasModule],
  controllers: [BookingsController, StaffController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}