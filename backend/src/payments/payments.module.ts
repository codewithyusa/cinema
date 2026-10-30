import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { CinemasModule } from '../cinemas/cinemas.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [CinemasModule, BookingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}