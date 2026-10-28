import { IsIn, IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @Min(1)
  showtimeId!: number;

  @IsIn(['telebirr', 'card', 'cash'])
  method!: 'telebirr' | 'card' | 'cash';
}