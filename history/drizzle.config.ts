import type { Config } from 'drizzle-kit';

export default {
  schema: './src/entities/*/model/schema.ts',
  out: './drizzle',
  driver: 'expo',
  dialect: 'sqlite',
} satisfies Config;