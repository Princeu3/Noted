import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@noted/db";

export const auth = betterAuth({
  basePath: "/api/auth",
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [process.env.APP_URL || "http://localhost:5173"],
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
});
