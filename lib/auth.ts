import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getRemainingUses, syncUserDailyUsage } from "@/lib/usage";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        await connectDB();

        const username = parsed.data.username.trim().toLowerCase();
        const user = await User.findOne({ username });
        if (!user) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        await syncUserDailyUsage(user);

        return {
          id: String(user._id),
          name: user.username,
          email: user.email,
          role: user.role,
          dailyAllowance: user.dailyAllowance,
          remainingUses: getRemainingUses(user),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.dailyAllowance = user.dailyAllowance;
        token.remainingUses = user.remainingUses;
        token.username = user.name ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "user";
        session.user.dailyAllowance = (token.dailyAllowance as number) ?? 0;
        session.user.remainingUses = (token.remainingUses as number) ?? 0;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
});
