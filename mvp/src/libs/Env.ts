import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    // Optional so Clerk keyless dev mode can provision temporary keys.
    CLERK_SECRET_KEY: z.string().optional(),
    DATABASE_URL: z.string().min(1),
    ADMIN_EMAILS: z.string().optional(), // comma-separated admin allowlist
    RATING_WINDOW_DAYS: z.coerce.number().default(7),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_LOGGING_LEVEL: z.enum(['error', 'info', 'debug', 'warning', 'trace', 'fatal']).default('info'),
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: z.string().optional(),
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    RATING_WINDOW_DAYS: process.env.RATING_WINDOW_DAYS,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_LOGGING_LEVEL: process.env.NEXT_PUBLIC_LOGGING_LEVEL,
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN,
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST,
    NODE_ENV: process.env.NODE_ENV,
  },
});
