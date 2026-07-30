import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin" | "user";
    dailyAllowance?: number;
    remainingUses?: number;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "user";
      dailyAllowance: number;
      remainingUses: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "user";
    dailyAllowance?: number;
    remainingUses?: number;
    username?: string;
  }
}
