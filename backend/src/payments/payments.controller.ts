import { Body, Controller, Get, Header, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuoteDto } from '../bookings/bookings.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // The page Chapa sends the customer to after paying.
  @Get('done')
  @Header('Content-Type', 'text/html; charset=utf-8')
  done() {
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment</title></head><body style="font-family:sans-serif;background:#0b0809;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center"><div><h2>Thank you</h2><p>You can close this page and go back to the YUSA CINEMA app.</p></div></body></html>';
  }

  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  initialize(@Body() dto: QuoteDto, @Req() req: { user: { id: number } }) {
    return this.payments.initialize(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify/:txRef')
  verify(@Param('txRef') txRef: string, @Req() req: { user: { id: number } }) {
    return this.payments.verify(req.user.id, txRef);
  }
}