// lib/db.ts — Wrapper de Vercel Postgres
// Fix #9: params acepta `unknown` para soportar JSONB y otros tipos complejos
import { sql } from '@vercel/postgres';

export const db = sql;

export async function query<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await db.query(text, params as (string | number | boolean | null | undefined)[]);
  return result.rows as T[];
}
