import { Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WatchlistService } from './watchlist.service';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistService) {}

  @Get()
  list(@Req() req: { user: { id: number } }) {
    return this.watchlist.list(req.user.id);
  }

  @Post(':movieId')
  add(@Param('movieId', ParseIntPipe) movieId: number, @Req() req: { user: { id: number } }) {
    return this.watchlist.add(req.user.id, movieId);
  }

  @Delete(':movieId')
  remove(@Param('movieId', ParseIntPipe) movieId: number, @Req() req: { user: { id: number } }) {
    return this.watchlist.remove(req.user.id, movieId);
  }
}