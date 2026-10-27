import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../db/database.service';
import { LoginDto, SignUpDto } from './auth.dto';

type UserRow = { id: number; name: string; email: string; password_hash: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    const existing = this.db.get<UserRow>('SELECT id FROM users WHERE email = ?', dto.email);
    if (existing) throw new ConflictException('An account with this email already exists.');

    // The password is never saved. Only a one-way hash of it is.
    const hash = await bcrypt.hash(dto.password, 10);
    const result = this.db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      dto.name,
      dto.email,
      hash,
    );

    return this.session({ id: Number(result.lastInsertRowid), name: dto.name, email: dto.email });
  }

  async login(dto: LoginDto) {
    const user = this.db.get<UserRow>('SELECT * FROM users WHERE email = ?', dto.email);

    // Same message for a missing account and a wrong password, so nobody can
    // use the login form to find out which emails are registered.
    const ok = user ? await bcrypt.compare(dto.password, user.password_hash) : false;
    if (!user || !ok) throw new UnauthorizedException('Wrong email or password.');

    return this.session(user);
  }

  me(userId: number) {
    const user = this.db.get<UserRow>('SELECT id, name, email FROM users WHERE id = ?', userId);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, name: user.name, email: user.email };
  }

  // The token is the login "ticket". The app sends it with later requests.
  private async session(user: { id: number; name: string; email: string }) {
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}