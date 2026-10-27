import { Module } from '@nestjs/common';
import { CinemasController } from './cinemas.controller';
import { CinemasService } from './cinemas.service';
import { ShowtimesController } from './showtimes.controller';

@Module({
  controllers: [CinemasController, ShowtimesController],
  providers: [CinemasService],
})
export class CinemasModule {}