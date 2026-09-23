"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "mi-secreto-super-seguro-cambiar-en-produccion",
);

export async function login(formData: FormData) {
  const password = formData.get("password") as string;

  if (password === "ml1423") {
    // Crear token JWT
    const token = await new SignJWT({ authenticated: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    // Establecer cookie
    (await cookies()).set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    redirect("/adm/usuarios");
  } else {
    return { error: "Contraseña incorrecta" };
  }
}

export async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token.value, secret);
    return true;
  } catch (error) {
    return false;
  }
}

export async function logout() {
  (await cookies()).delete("auth-token");
  redirect("/adm");
}
