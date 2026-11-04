import { Controller, Get } from '@nestjs/common';
import { ComingSoonService } from './coming-soon.service';

@Controller('coming-soon')
export class ComingSoonController {
  constructor(private readonly comingSoon: ComingSoonService) {}

  @Get()
  list() {
    return this.comingSoon.list();
  }
}