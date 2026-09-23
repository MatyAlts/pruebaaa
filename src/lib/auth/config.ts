import NextAuth, { NextAuthOptions, User, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import CredentialsProvider from "next-auth/providers/credentials";
import { pool } from "@/src/lib/database/connection";
import { dateNowWithMinutes } from "@/config/date";
// Extender tipos de NextAuth
declare module "next-auth" {
  interface User {
    type: string;
    userId: string | null;
  }
  interface Session {
    user: {
      userId: string | null;
      name: string | null;
      email: string | null;
      type: string;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    type?: string;
    provider?: string; // Provider original (google, credentials)
    userId?: string;
    sessionId?: string;
  }
}

interface GoogleProfile {
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account", // Siempre mostrar selector de cuenta
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
        },
      },
      profile(profile): User {
        // 👈 Aquí defines qué props tendrá el objeto 'user'
        return {
          id: profile.sub, // ID único de Google
          name: profile.name, // Nombre completo
          email: profile.email, // Email
          image: profile.picture, // Foto de perfil
          // ✅ Puedes agregar más:
          type: "google",
          userId: null, // Se obtendrá de la BD en el callback jwt
        };
      },
    }),

  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, //7 dias
  },

  callbacks: {
    async signIn({ user, profile, account }) {

      // Solo ejecutar lógica de DB para Google Provider
      if (!profile || account?.provider !== "google") {
        return true;
      }

      // Lógica para Google Provider
      const googleProfile = profile as GoogleProfile;



      const [rows] = (await pool.execute(
        "SELECT * FROM users WHERE email = ? LIMIT 1",
        [user.email]
      )) as RowDataPacket[];

      if ((rows as RowDataPacket[]).length === 0) {
        await pool.execute(
          "INSERT INTO users (name, email, given_name, family_name, image, locale, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ",
          [
            googleProfile.name || "",
            user.email,
            googleProfile.given_name || "",
            googleProfile.family_name || "",
            googleProfile.picture || "",
            googleProfile.locale || "",
            dateNowWithMinutes(),
          ]
        );
      } else {
        await pool.execute(
          "UPDATE users SET name=?, given_name=?, family_name=?, image=?, locale=?, updated_at=? WHERE email=? LIMIT 1",
          [
            googleProfile.name ?? null,
            googleProfile.given_name ?? null,
            googleProfile.family_name ?? null,
            googleProfile.picture ?? null,
            googleProfile.locale ?? null,
            dateNowWithMinutes(),
            user.email,
          ]
        );
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // En el primer login, user existe
      if (user) {
        token.type = user.type;
        token.sessionId = user.email ?? undefined; // Usar email como sessionId (convertir null a undefined)

        // Obtener el ID real de la base de datos
        try {
          const [rows] = (await pool.execute(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [user.email]
          )) as RowDataPacket[];

          if ((rows as RowDataPacket[]).length > 0) {
            token.userId = String(rows[0].id); // Guardar el ID de la BD
          }
        } catch (error) {
          console.error("Error al obtener userId de BD:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Si el token no existe o no tiene sessionId, NextAuth ya lo manejará
      // No debemos retornar null aquí, ya que causa CLIENT_FETCH_ERROR
      if (!token || !token.sessionId) {
        throw new Error("Invalid session");
      }

      // Pasa el type del token a la sesión
      if (token.type) {
        session.user!.type = token.type;
      }
      if (token.userId) {
        session.user.userId = token.userId;
      }

      // const [rows] = await pool.query(
      //   "SELECT id, locale FROM users WHERE email = ?",
      //   [session.user.email]
      // );

      // if (rows.length > 0) {
      //   session.user.id = rows[0].id;
      //   session.user.locale = rows[0].locale;
      // }

      return session;
    },
  },
};
export default NextAuth(authOptions);
