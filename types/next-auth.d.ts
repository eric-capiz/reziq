import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin" | "user";
    usesAssigned?: number;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "user";
      usesAssigned: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "user";
    usesAssigned?: number;
    username?: string;
  }
}
