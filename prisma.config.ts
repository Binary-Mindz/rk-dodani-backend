import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL is not set in environment variables');
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  
  // Prisma 7-এ মাইগ্রেশনের জন্য শুধু এটি লাগবে
  datasource: {
    url: connectionString,
  },

  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});