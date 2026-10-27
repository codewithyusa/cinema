import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

// Removes spaces around a name.
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Removes spaces and makes the email lowercase, so
// " Yusuf@Example.com " and "yusuf@example.com" are the same account.
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SignUpDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(24)
  name: string;

  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  // bcrypt only reads the first 72 characters, so longer passwords are refused.
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}