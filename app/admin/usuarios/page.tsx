'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── TIPOS ────────────────────────────────────────────────────
interface UserRow {
  id:                   number
  email:                string
  role:                 'guest' | 'premium' | 'admin'
  referral_code:        string
  referred_by:          number | null
  created_at:           string
  effective_expiry:     string | null
  total_paid:           number
  payment_count:        number
  referral_count:       number
  referral_days_earned: number
  is_active:            boolean
}

interface Pagination {
  page:        number
  limit:       number
  total:       number
  total_pages: number
  has_next:    boolean
  has_prev:    boolean
}

interface UserDetail {
  user: UserRow & { referred_by_email: string | null }
  subscriptions: { id: number; plan: string; expiry_date: string; free_trial_used: boolean; created_at: string }[]
  payments:      { id: number; tx_hash: string; plan: string; amount: number; currency: string; network: string; status: string; created_at: string; verified_at: string | null }[]
  referrals:     { id: number; email: string; role: string; reward_days: number; granted_at: string }[]
  coupons:       { code: string; reward_days: number; redeemed_at: string }[]
  summary:       { total_paid: number; total_referrals: number; total_referral_days: number; total_coupons_used: number }
}

type RoleFilter = 'all' | 'guest' | 'premium' | 'admin'
type ActionType = 'extend_days' | 'change_role' | 'revoke_access'

// ─── HELPERS ─────────────────────────────────────────────────
function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin:   'bg-red-900/40 text-red-400 border-red-700',
    premium: 'bg-[#C09A51]/20 text-[#C09A51] border-[#C09A51]/40',
    guest:   'bg-gray-800 text-gray-400 border-gray-700',
  }
  return map[role] ?? map['guest']
}

function roleLabel(role: string) {
  return role === 'admin' ? '⚔ Admin' : role === 'premium' ? '💎 Premium' : '👤 Guest'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtDateFull(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysLeft(expiry: string | null): number {
  if (!expiry) return 0
  return Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000))
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function AdminUsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers]           = useState<UserRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [page, setPage]             = useState(1)

  // Modal de detalle
  const [selectedUser, setSelectedUser]   = useState<UserDetail | null>(null)
  const [modalLoading, setModalLoading]   = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'pagos' | 'referidos' | 'acciones'>('info')

  // Estado de acciones en el modal
  const [actionLoading, setActionLoading]   = useState(false)
  const [actionMsg, setActionMsg]           = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [extendDays, setExtendDays]         = useState(30)
  const [newRole, setNewRole]               = useState<'guest' | 'premium' | 'admin'>('premium')

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin
      if (!isAdmin) { router.push('/'); return }
    }
  }, [status, session, router])

  // ── Fetch usuarios ────────────────────────────────────────
  const fetchUsers = useCallback(async (s: string, r: RoleFilter, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:  String(p),
        limit: '15',
        role:  r,
        ...(s.trim() ? { search: s.trim() } : {}),
      })
      const res = await fetch(`/api/admin/usuarios?${params}`)
      if (!res.ok) throw new Error('Error al cargar usuarios')
      const data = await res.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchUsers(search, roleFilter, page)
  }, [status, page, roleFilter, fetchUsers])  // search se maneja con debounce abajo

  // Debounce del search
  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchUsers(val, roleFilter, 1), 400)
  }

  // ── Abrir modal de detalle ────────────────────────────────
  const openUserDetail = async (userId: number) => {
    setModalLoading(true)
    setSelectedUser(null)
    setActionMsg(null)
    setActiveModalTab('info')
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`)
      if (!res.ok) throw new Error()
      setSelectedUser(await res.json())
    } catch {
      setActionMsg({ text: 'Error al cargar el usuario.', type: 'error' })
    } finally {
      setModalLoading(false)
    }
  }

  // ── Ejecutar acción sobre usuario ─────────────────────────
  const handleAction = async (userId: number, action: ActionType) => {
    setActionLoading(true)
    setActionMsg(null)
    try {
      const body: Record<string, unknown> = { action }
      if (action === 'extend_days') body.days = extendDays
      if (action === 'change_role') body.role = newRole

      const res  = await fetch(`/api/admin/usuarios/${userId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (res.ok) {
        setActionMsg({ text: data.message, type: 'success' })
        // Refrescar detalle y lista
        await openUserDetail(userId)
        fetchUsers(search, roleFilter, page)
      } else {
        setActionMsg({ text: data.error ?? 'Error.', type: 'error' })
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#C09A51] animate-pulse">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-gray-500 hover:text-[#C09A51] transition-colors text-sm"
              >
                ← Panel Admin
              </Link>
              <span className="text-gray-700">/</span>
              <h1 className="text-2xl font-black text-[#C09A51] uppercase italic tracking-tighter">
                👥 Usuarios
              </h1>
            </div>
            {pagination && (
              <p className="text-gray-500 text-sm mt-1">
                {pagination.total} usuarios registrados
              </p>
            )}
          </div>
        </div>

        {/* ── FILTROS ── */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar por email o código de referido..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="albion-input rounded-xl pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'premium', 'guest', 'admin'] as RoleFilter[]).map(r => (
              <button
                key={r}
                onClick={() => { setRoleFilter(r); setPage(1); fetchUsers(search, r, 1) }}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                  roleFilter === r
                    ? 'bg-[#8B0000] border-[#C09A51] text-[#C09A51]'
                    : 'bg-black/20 border-[#3F2F23] text-gray-500 hover:border-[#5a4030]'
                }`}
              >
                {r === 'all' ? 'Todos' : r}
              </button>
            ))}
          </div>
        </div>

        {/* ── TABLA ── */}
        <div className="albion-panel rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-[#C09A51] animate-pulse">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-400 text-sm">No se encontraron usuarios con esos filtros.</p>
            </div>
          ) : (
            <>
              {/* Header de tabla */}
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-[#3F2F23] bg-black/30">
                {['Usuario', 'Rol', 'Acceso', 'Pagado', 'Referidos', 'Registro', ''].map((h, i) => (
                  <div
                    key={h}
                    className={`text-[9px] text-gray-500 uppercase font-bold ${
                      i === 0 ? 'col-span-3' :
                      i === 1 ? 'col-span-2' :
                      i === 2 ? 'col-span-2' :
                      i === 3 ? 'col-span-1' :
                      i === 4 ? 'col-span-1' :
                      i === 5 ? 'col-span-2' : 'col-span-1'
                    }`}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Filas */}
              {users.map(u => (
                <div
                  key={u.id}
                  className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[#3F2F23]/50 hover:bg-white/5 transition-colors items-center group"
                >
                  {/* Email + referral code */}
                  <div className="col-span-3 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{u.email}</p>
                    <p className="text-gray-600 text-[10px] font-mono">{u.referral_code}</p>
                  </div>

                  {/* Rol */}
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${roleBadge(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </div>

                  {/* Acceso / expiración */}
                  <div className="col-span-2">
                    {u.is_active ? (
                      <div>
                        <p className="text-green-400 text-xs font-bold">{daysLeft(u.effective_expiry)} días</p>
                        <p className="text-gray-600 text-[10px]">{u.effective_expiry ? fmtDate(u.effective_expiry) : '—'}</p>
                      </div>
                    ) : (
                      <p className="text-red-400 text-xs font-bold">Expirado</p>
                    )}
                  </div>

                  {/* Total pagado */}
                  <div className="col-span-1">
                    <p className="text-green-400 text-xs font-bold">
                      ${u.total_paid.toFixed(0)}
                    </p>
                    <p className="text-gray-600 text-[10px]">{u.payment_count} pago{u.payment_count !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Referidos */}
                  <div className="col-span-1">
                    <p className="text-[#C09A51] text-xs font-bold">{u.referral_count}</p>
                    {u.referral_days_earned > 0 && (
                      <p className="text-gray-600 text-[10px]">+{u.referral_days_earned}d</p>
                    )}
                  </div>

                  {/* Fecha registro */}
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs">{fmtDate(u.created_at)}</p>
                  </div>

                  {/* Botón ver */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => openUserDetail(u.id)}
                      className="px-3 py-1.5 bg-[#8B0000]/40 border border-[#8B0000] text-[#C09A51] rounded-lg text-[10px] font-black uppercase hover:bg-[#8B0000]/70 transition-all opacity-0 group-hover:opacity-100"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── PAGINACIÓN ── */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs">
              Página {pagination.page} de {pagination.total_pages} · {pagination.total} usuarios
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!pagination.has_prev}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-[#3F2F23] text-gray-400 hover:border-[#C09A51] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Anterior
              </button>
              {/* Números de página */}
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const n = Math.max(1, Math.min(pagination.total_pages - 4, page - 2)) + i
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-9 h-9 text-xs font-black rounded-lg border transition-all ${
                      n === page
                        ? 'bg-[#8B0000] border-[#C09A51] text-[#C09A51]'
                        : 'border-[#3F2F23] text-gray-500 hover:border-[#C09A51]'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.has_next}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-[#3F2F23] text-gray-400 hover:border-[#C09A51] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DE DETALLE ── */}
      {(modalLoading || selectedUser) && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) { setSelectedUser(null) } }}
        >
          <div className="w-full max-w-3xl albion-panel rounded-2xl my-8 overflow-hidden">

            {modalLoading ? (
              <div className="p-16 text-center">
                <p className="text-[#C09A51] animate-pulse text-lg">Cargando usuario...</p>
              </div>
            ) : selectedUser && (
              <>
                {/* Modal header */}
                <div className="p-6 border-b border-[#3F2F23] flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-[#C09A51] font-black text-xl">{selectedUser.user.email}</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${roleBadge(selectedUser.user.role)}`}>
                        {roleLabel(selectedUser.user.role)}
                      </span>
                      <span className="text-gray-500 text-xs font-mono">{selectedUser.user.referral_code}</span>
                      <span className="text-gray-600 text-xs">ID #{selectedUser.user.id}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-500 hover:text-white text-2xl transition-colors leading-none ml-4"
                  >
                    ×
                  </button>
                </div>

                {/* Resumen rápido */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-[#3F2F23] bg-black/20">
                  {[
                    { label: 'Total Pagado',  value: `$${selectedUser.summary.total_paid}`,          color: 'text-green-400' },
                    { label: 'Referidos',     value: selectedUser.summary.total_referrals,            color: 'text-[#C09A51]' },
                    { label: 'Días Ganados',  value: `+${selectedUser.summary.total_referral_days}d`, color: 'text-blue-400' },
                    { label: 'Acceso',
                      value: selectedUser.user.is_active
                        ? `${daysLeft(selectedUser.user.effective_expiry)} días`
                        : 'Expirado',
                      color: selectedUser.user.is_active ? 'text-green-400' : 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-gray-500 text-[10px] uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Tabs del modal */}
                <div className="flex border-b border-[#3F2F23] overflow-x-auto">
                  {(['info', 'pagos', 'referidos', 'acciones'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setActiveModalTab(tab); setActionMsg(null) }}
                      className={`px-5 py-3 text-xs font-bold uppercase transition-all whitespace-nowrap ${
                        activeModalTab === tab
                          ? 'text-[#C09A51] border-b-2 border-[#C09A51]'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab === 'info'      ? '📋 Info'      :
                       tab === 'pagos'     ? `💰 Pagos (${selectedUser.payments.length})` :
                       tab === 'referidos' ? `🎁 Referidos (${selectedUser.referrals.length})` :
                       '⚙️ Acciones'}
                    </button>
                  ))}
                </div>

                {/* Contenido del tab */}
                <div className="p-6 max-h-[55vh] overflow-y-auto">

                  {/* Tab: Info */}
                  {activeModalTab === 'info' && (
                    <div className="space-y-4">
                      {[
                        { label: 'Email',            value: selectedUser.user.email },
                        { label: 'Rol actual',        value: roleLabel(selectedUser.user.role) },
                        { label: 'Código referido',   value: selectedUser.user.referral_code, mono: true },
                        { label: 'Invitado por',      value: selectedUser.user.referred_by_email ?? 'Registro orgánico' },
                        { label: 'Registrado',        value: fmtDateFull(selectedUser.user.created_at) },
                        { label: 'Vence',             value: selectedUser.user.effective_expiry ? fmtDateFull(selectedUser.user.effective_expiry) : 'Sin suscripción' },
                        { label: 'Cupones canjeados', value: `${selectedUser.summary.total_coupons_used} cupón${selectedUser.summary.total_coupons_used !== 1 ? 'es' : ''}` },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-2 border-b border-[#3F2F23]/40">
                          <span className="text-gray-500 text-xs uppercase font-bold">{row.label}</span>
                          <span className={`text-sm font-bold ${row.mono ? 'font-mono text-[#C09A51]' : 'text-white'}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}

                      {/* Últimas suscripciones */}
                      {selectedUser.subscriptions.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Historial de suscripciones recientes</p>
                          <div className="space-y-2">
                            {selectedUser.subscriptions.slice(0, 5).map(s => (
                              <div key={s.id} className="flex justify-between items-center bg-black/30 rounded-lg px-3 py-2">
                                <div>
                                  <span className="text-[#C09A51] text-xs font-bold uppercase">{s.plan}</span>
                                  {s.free_trial_used && <span className="ml-2 text-[9px] text-gray-500">Trial</span>}
                                </div>
                                <span className="text-gray-400 text-xs">{fmtDate(s.expiry_date)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Pagos */}
                  {activeModalTab === 'pagos' && (
                    <div className="space-y-3">
                      {selectedUser.payments.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">Sin pagos registrados.</p>
                      ) : selectedUser.payments.map(p => (
                        <div key={p.id} className="bg-black/30 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full border ${
                                p.status === 'verified'
                                  ? 'bg-green-900/30 text-green-400 border-green-700'
                                  : p.status === 'rejected'
                                  ? 'bg-red-900/30 text-red-400 border-red-700'
                                  : 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
                              }`}>
                                {p.status === 'verified' ? '✓ Verificado' : p.status === 'rejected' ? '✗ Rechazado' : '⏳ Pendiente'}
                              </span>
                              <span className="ml-2 text-[#C09A51] font-black text-sm capitalize">{p.plan}</span>
                            </div>
                            <span className="text-green-400 font-black">{p.amount} {p.currency}</span>
                          </div>
                          <a
                            href={`https://${p.network === 'BEP20' ? 'bscscan.com' : 'basescan.org'}/tx/${p.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10px] text-gray-500 hover:text-[#C09A51] transition-colors break-all block"
                          >
                            {p.tx_hash}
                          </a>
                          <p className="text-gray-600 text-[10px]">{fmtDateFull(p.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab: Referidos */}
                  {activeModalTab === 'referidos' && (
                    <div className="space-y-3">
                      {selectedUser.referrals.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No ha referido a nadie aún.</p>
                      ) : (
                        <>
                          <div className="bg-black/30 rounded-xl p-3 flex justify-between items-center mb-4">
                            <span className="text-gray-400 text-xs">Total días ganados</span>
                            <span className="text-[#C09A51] font-black text-xl">
                              +{selectedUser.summary.total_referral_days} días
                            </span>
                          </div>
                          {selectedUser.referrals.map(r => (
                            <div key={r.id} className="flex items-center justify-between bg-black/20 rounded-xl p-3">
                              <div>
                                <p className="text-white text-sm font-bold">{r.email}</p>
                                <p className="text-gray-600 text-[10px]">{fmtDateFull(r.granted_at)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[#C09A51] font-black">+{r.reward_days}d</p>
                                <span className={`text-[9px] uppercase ${roleBadge(r.role)} px-1.5 py-0.5 rounded border`}>
                                  {r.role}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Tab: Acciones */}
                  {activeModalTab === 'acciones' && (
                    <div className="space-y-6">

                      {/* Acción 1: Extender días */}
                      <div className="bg-black/30 rounded-xl p-5 space-y-4">
                        <div>
                          <h3 className="text-[#C09A51] font-black text-sm uppercase">➕ Extender Acceso</h3>
                          <p className="text-gray-500 text-xs mt-1">
                            Suma días al vencimiento actual del usuario. Útil para compensar errores o bonificar.
                          </p>
                        </div>
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Días a agregar</label>
                            <select
                              value={extendDays}
                              onChange={e => setExtendDays(Number(e.target.value))}
                              className="albion-input rounded-xl"
                            >
                              {[1, 3, 7, 14, 30, 60, 90, 180, 365].map(d => (
                                <option key={d} value={d}>{d} día{d > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => handleAction(selectedUser.user.id, 'extend_days')}
                            disabled={actionLoading}
                            className="px-6 py-3 bg-green-900/40 border border-green-600 text-green-400 font-black text-xs uppercase rounded-xl hover:bg-green-900/70 transition-all disabled:opacity-40 whitespace-nowrap"
                          >
                            {actionLoading ? '...' : '✓ Aplicar'}
                          </button>
                        </div>
                      </div>

                      {/* Acción 2: Cambiar rol */}
                      <div className="bg-black/30 rounded-xl p-5 space-y-4">
                        <div>
                          <h3 className="text-[#C09A51] font-black text-sm uppercase">🎭 Cambiar Rol</h3>
                          <p className="text-gray-500 text-xs mt-1">
                            Actualiza el nivel de acceso del usuario. Si degradas a guest, se revoca el acceso.
                          </p>
                        </div>
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Nuevo rol</label>
                            <select
                              value={newRole}
                              onChange={e => setNewRole(e.target.value as 'guest' | 'premium' | 'admin')}
                              className="albion-input rounded-xl"
                            >
                              <option value="premium">💎 Premium</option>
                              <option value="guest">👤 Guest (sin acceso)</option>
                              <option value="admin">⚔ Admin</option>
                            </select>
                          </div>
                          <button
                            onClick={() => handleAction(selectedUser.user.id, 'change_role')}
                            disabled={actionLoading}
                            className="px-6 py-3 bg-blue-900/40 border border-blue-700 text-blue-400 font-black text-xs uppercase rounded-xl hover:bg-blue-900/70 transition-all disabled:opacity-40 whitespace-nowrap"
                          >
                            {actionLoading ? '...' : '✓ Aplicar'}
                          </button>
                        </div>
                      </div>

                      {/* Acción 3: Revocar acceso */}
                      <div className="bg-red-900/10 border border-red-900/40 rounded-xl p-5 space-y-3">
                        <div>
                          <h3 className="text-red-400 font-black text-sm uppercase">⛔ Revocar Acceso Inmediato</h3>
                          <p className="text-gray-500 text-xs mt-1">
                            Expira la suscripción ahora mismo y degrada el rol a guest. No se puede deshacer fácilmente.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`¿Seguro que quieres revocar el acceso de ${selectedUser.user.email}?`)) {
                              handleAction(selectedUser.user.id, 'revoke_access')
                            }
                          }}
                          disabled={actionLoading}
                          className="w-full py-3 bg-red-900/40 border border-red-700 text-red-400 font-black text-xs uppercase rounded-xl hover:bg-red-900/70 transition-all disabled:opacity-40"
                        >
                          {actionLoading ? '...' : '⛔ Revocar Acceso'}
                        </button>
                      </div>

                      {/* Mensaje de resultado */}
                      {actionMsg && (
                        <div className={`p-4 rounded-xl text-sm font-medium text-center ${
                          actionMsg.type === 'success'
                            ? 'bg-green-900/30 border border-green-600 text-green-400'
                            : 'bg-red-900/30 border border-red-800 text-red-400'
                        }`}>
                          {actionMsg.text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
