import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// SQLite file database built into Node. When the app grows, replace this
// service with PostgreSQL. The other files only use run, get and all.
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private db: DatabaseSync;

  constructor() {
    const file = process.env.DATABASE_FILE ?? 'data/yusa.db';
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });

    this.db = new DatabaseSync(file);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  run(sql: string, ...params: (string | number | null)[]) {
    return this.db.prepare(sql).run(...params);
  }

  get<T>(sql: string, ...params: (string | number | null)[]): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  all<T>(sql: string, ...params: (string | number | null)[]): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  onModuleDestroy() {
    this.db.close();
  }
}