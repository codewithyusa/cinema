import { existsSync, readFileSync } from 'node:fs';

// Reads only the payment settings from backend/.env. Other settings are left alone,
// and values already set in the terminal win over the file.
const WANTED = /^(CHAPA_[A-Z_]+|PUBLIC_URL|ALLOW_DEMO_PAYMENTS)$/;

try {
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m || !WANTED.test(m[1]) || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
} catch {
  // A missing or unreadable .env just means the defaults are used.
}

export {};