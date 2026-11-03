import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@Controller('movies')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get(':id/reviews')
  list(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { id: number } }) {
    return this.reviews.list(id, req.user.id);
  }

  @Post(':id/reviews')
  save(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rating: number; comment?: string },
    @Req() req: { user: { id: number } },
  ) {
    return this.reviews.save(id, req.user.id, Number(body?.rating), body?.comment ?? '');
  }
}