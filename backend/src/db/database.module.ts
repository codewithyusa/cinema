import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

// Global, so every feature module can use the database without importing it.
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}