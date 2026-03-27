// app/api/admin/usuarios/route.ts
// GET  → lista paginada de usuarios con búsqueda y filtros
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { AdminSearchUsersSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { isAdmin?: boolean }).isAdmin !== true) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    // Parsear query params
    const { searchParams } = new URL(req.url);
    const parsed = AdminSearchUsersSchema.safeParse({
      search: searchParams.get('search') ?? undefined,
      page:   Number(searchParams.get('page')  ?? 1),
      limit:  Number(searchParams.get('limit') ?? 15),
      role:   searchParams.get('role') ?? 'all',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const { search, page, limit, role } = parsed.data;
    const offset = (page - 1) * limit;

    // Construir filtros dinámicos
    const conditions: string[] = [];
    const params: unknown[]    = [];
    let   paramIdx             = 1;

    if (search) {
      conditions.push(
        `(u.email ILIKE $${paramIdx} OR u.referral_code ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (role !== 'all') {
      conditions.push(`u.role = $${paramIdx}`);
      params.push(role);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query principal: usuarios + suscripción activa + stats
    const usersQuery = `
      SELECT
        u.id,
        u.email,
        u.role,
        u.referral_code,
        u.referred_by,
        u.created_at,
        -- Expiración efectiva (suscripción + días de referidos)
        get_user_expiry(u.id)                        AS effective_expiry,
        -- Total pagado
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'verified'), 0) AS total_paid,
        -- Número de pagos verificados
        COUNT(p.id) FILTER (WHERE p.status = 'verified')                AS payment_count,
        -- Referidos que hicieron pagos
        COUNT(rr.id)                                                    AS referral_count,
        -- Días ganados por referidos
        COALESCE(SUM(rr.reward_days), 0)                                AS referral_days_earned
      FROM users u
      LEFT JOIN payments p         ON p.user_id = u.id
      LEFT JOIN referral_rewards rr ON rr.referrer_id = u.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    // Query de conteo total (para paginación)
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM users u
      ${whereClause}
    `;

    const [rows, countRows] = await Promise.all([
      query<{
        id: number;
        email: string;
        role: string;
        referral_code: string;
        referred_by: number | null;
        created_at: string;
        effective_expiry: string | null;
        total_paid: string;
        payment_count: string;
        referral_count: string;
        referral_days_earned: string;
      }>(usersQuery, [...params, limit, offset]),
      query<{ total: string }>(countQuery, params),
    ]);

    const total      = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: rows.map(u => ({
        id:                   u.id,
        email:                u.email,
        role:                 u.role,
        referral_code:        u.referral_code,
        referred_by:          u.referred_by,
        created_at:           u.created_at,
        effective_expiry:     u.effective_expiry,
        total_paid:           Number(u.total_paid),
        payment_count:        Number(u.payment_count),
        referral_count:       Number(u.referral_count),
        referral_days_earned: Number(u.referral_days_earned),
        is_active:            u.effective_expiry
                                ? new Date(u.effective_expiry) > new Date()
                                : false,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next:    page < totalPages,
        has_prev:    page > 1,
      },
    });
  } catch (error) {
    console.error('[ADMIN_USUARIOS_LIST_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener usuarios.' }, { status: 500 });
  }
}
