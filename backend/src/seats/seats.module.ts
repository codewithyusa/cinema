import { Module } from '@nestjs/common';
import { CinemasModule } from '../cinemas/cinemas.module';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';

@Module({
  imports: [CinemasModule],
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}