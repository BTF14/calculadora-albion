import { sql } from '@vercel/postgres';

export const db = sql;

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await db.query(text, params);
  return result.rows as T[];
}
