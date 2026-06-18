import { z } from "zod";

// ✅ Define the environment schema
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(), // Ensure it's a valid URL
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "production", "staging"]), // Restrict to specific values
  NEXT_PUBLIC_API_KEY: z.string().min(1), // Ensure it's non-empty
  SECRET_KEY: z.string().optional(), // Optional for server-side use
});

// ✅ Parse and validate `process.env`
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.flatten());
  throw new Error(
    "Invalid or missing environment variables. Check `.env.local`.",
  );
}

// ✅ Export the validated environment
export const env = parsedEnv.data;
