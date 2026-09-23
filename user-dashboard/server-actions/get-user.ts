"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/database";
import { RowDataPacket } from "mysql2/promise";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string; // Formato: DD-MM-YYYY
}

/**
 * Obtiene los datos del usuario actual
 */
export async function getUser(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.userId) {
      return null;
    }

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT id, name, email, image
       FROM users 
       WHERE id = ?`,
      [session.user.userId]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      image: row.image,
      createdAt: row.created_at, // Mantener como string DD-MM-YYYY
    };
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return null;
  }
}
