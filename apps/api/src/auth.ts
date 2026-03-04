import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@noted/db";

const isProduction = process.env.RAILWAY_ENVIRONMENT === "production";

export const auth = betterAuth({
  basePath: "/api/auth",
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [process.env.APP_URL || "http://localhost:5173"],
  advanced: isProduction
    ? {
        defaultCookieAttributes: {
          sameSite: "none",
          secure: true,
          partitioned: true,
        },
      }
    : {},
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
});
