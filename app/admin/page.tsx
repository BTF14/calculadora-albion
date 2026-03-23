import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { head } from '@vercel/blob'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) redirect('/')

  const payments = await query(`
    SELECT p.id, p.user_id, p.screenshot_url, p.status, p.submitted_at, p.plan, u.email
    FROM payments p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'pending'
    ORDER BY p.submitted_at DESC
  `)

  const paymentsWithSignedUrl = await Promise.all(
    payments.map(async (p: any) => {
      const blobHead = await head(p.screenshot_url)
      const signedUrl = blobHead.downloadUrl
      return { ...p, signedUrl }
    })
  )

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Panel de administración</h1>
      {paymentsWithSignedUrl.length === 0 ? (
        <p>No hay pagos pendientes.</p>
      ) : (
        <div className="space-y-4">
          {paymentsWithSignedUrl.map((p: any) => (
            <div key={p.id} className="border rounded p-4 shadow-sm">
              <p><strong>Usuario:</strong> {p.email}</p>
              <p><strong>Plan:</strong> {p.plan}</p>
              <p><strong>Fecha:</strong> {new Date(p.submitted_at).toLocaleString()}</p>
              <p><strong>Captura:</strong> <a href={p.signedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver imagen</a></p>
              <form action="/api/admin/verify-payment" method="POST" className="mt-2">
                <input type="hidden" name="paymentId" value={p.id} />
                <input type="hidden" name="plan" value={p.plan} />
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                  Verificar pago
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
