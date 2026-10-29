import { IsIn, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class QuoteDto {
  @IsInt()
  @Min(1)
  showtimeId!: number;

  // Example: { "popcorn": 1, "soda": 2 }
  @IsOptional()
  @IsObject()
  snacks?: Record<string, number>;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  promoCode?: string;
}

export class CreateBookingDto extends QuoteDto {
  @IsIn(['telebirr', 'card', 'cash'])
  method!: 'telebirr' | 'card' | 'cash';
}