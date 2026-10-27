import { Controller, Get } from '@nestjs/common';
import { CinemasService } from './cinemas.service';

@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemas: CinemasService) {}

  @Get()
  list() {
    return this.cinemas.listCinemas();
  }
}