import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5001"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  CLIENT_ORIGIN: z.string().url(),
  COOKIE_SECRET: z.string().min(32),

  TWILIO_ACCOUNT_SID: z.string().startsWith("AC"),
  TWILIO_AUTH_TOKEN: z.string().min(32),
  TWILIO_PHONE_NUMBER: z.string().startsWith("+"),
  GEMINI_API_KEY: z.string().startsWith("AIza"),
  WEBHOOK_BASE_URL: z.string().url(),
  DAILY_CALL_LIMIT: z.string().default("35"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;