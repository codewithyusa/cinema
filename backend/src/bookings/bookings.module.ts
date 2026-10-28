import { Module } from '@nestjs/common';
import { CinemasModule } from '../cinemas/cinemas.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [CinemasModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}