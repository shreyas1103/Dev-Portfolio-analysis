const { z } = require("zod");
require("dotenv").config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(1, "JWT_ACCESS_SECRET is required"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(1, "JWT_REFRESH_SECRET is required"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  GITHUB_CLIENT_ID: z
    .string()
    .min(1, "GITHUB_CLIENT_ID is required"),

  GITHUB_CLIENT_SECRET: z
    .string()
    .min(1, "GITHUB_CLIENT_SECRET is required"),

  GITHUB_REDIRECT_URI: z
    .string()
    .url("GITHUB_REDIRECT_URI must be a valid URL"),

  OAUTH_STATE_SECRET: z
    .string()
    .min(1, "OAUTH_STATE_SECRET is required"),

  ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      "ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes)"
    ),

  CLIENT_URL: z
    .string()
    .url("CLIENT_URL must be a valid URL"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = {
  port: parsed.data.PORT,
  mongodbUri: parsed.data.MONGODB_URI,
  jwtAccessSecret: parsed.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  nodeEnv: parsed.data.NODE_ENV,
  githubClientId: parsed.data.GITHUB_CLIENT_ID,
  githubClientSecret: parsed.data.GITHUB_CLIENT_SECRET,
  githubRedirectUri: parsed.data.GITHUB_REDIRECT_URI,
  oauthStateSecret: parsed.data.OAUTH_STATE_SECRET,
  encryptionKey: parsed.data.ENCRYPTION_KEY,
  clientUrl: parsed.data.CLIENT_URL,
};