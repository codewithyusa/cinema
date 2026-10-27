import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class HoldSeatsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  seats!: string[];
}