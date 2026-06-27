// app/api/auth/[...nextauth]/options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { UserRole } from "@prisma/client";
import { checkRateLimit } from "@/lib/rate-limit";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    divisi?: string | null;
    title?: string | null;
    image?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      divisi?: string | null;
      title?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    divisi?: string | null;
    title?: string | null;
    image?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Rate Limiter Check
        const forwardedFor = req?.headers?.["x-forwarded-for"];
        const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : "unknown-ip";
        const rateLimitResult = checkRateLimit(ip, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
        
        if (!rateLimitResult.success) {
          throw new Error("Terlalu banyak percobaan login. Silakan coba lagi nanti.");
        }

        // Validasi input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error("Input tidak valid.");

        const { email, password } = parsed.data;

        // Cari user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
          throw new Error("Email atau password salah.");
        }

        // Cek password
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new Error("Email atau password salah.");

        // PENTING: Jangan return image base64! NextAuth otomatis copy user.image
        // ke token.picture yang menyebabkan session cookie membengkak.
        // Hanya return URL path, bukan base64.
        const safeImage = user.image && !user.image.startsWith("data:") ? user.image : null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          divisi: user.divisi,
          title: user.title,
          image: safeImage,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 jam (1 hari kerja)
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Helper: hanya simpan image jika berupa URL path, BUKAN base64
      // Base64 image bisa ratusan KB - MB dan menyebabkan session cookie membengkak
      const sanitizeImage = (img: string | null | undefined): string | null => {
        if (!img) return null;
        if (img.startsWith("data:")) return null; // Tolak base64!
        return img;
      };

      // KRITIS: Hapus token.picture!
      // NextAuth v4 otomatis copy user.image ke token.picture (field default).
      // Jika image berupa base64, token.picture akan berisi ratusan KB data
      // yang membuat session cookie membengkak walaupun token.image sudah kita sanitize.
      delete (token as any).picture;

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.divisi = user.divisi;
        token.title = user.title;
        token.image = sanitizeImage(user.image);
      }
      
      // Update token if user profile is updated
      if (trigger === "update" && session) {
        token.name = session.name;
        token.title = session.title;
        token.image = sanitizeImage(session.image);
      }

      // Sanitize: jika token sudah terlanjur menyimpan base64, bersihkan
      if (typeof token.image === "string" && token.image.startsWith("data:")) {
        token.image = null;
      }

      // Re-sync with DB periodically or on demand
      if (!token.title || !token.image) {
        const dbUser = await prisma.user.findUnique({ 
          where: { id: token.id as string },
          select: { title: true, image: true, name: true }
        });
        if (dbUser) {
          token.title = dbUser.title;
          token.image = sanitizeImage(dbUser.image);
          token.name = dbUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.divisi = token.divisi as string;
      session.user.title = token.title as string;
      session.user.image = token.image as string;
      session.user.name = token.name as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};
