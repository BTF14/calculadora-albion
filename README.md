# ⚒️ Albion Crafting Hub — v4.0

Plataforma SaaS de alto rendimiento para la economía de Albion Online.  
Stack: **Next.js 14 · Vercel Postgres · Resend · Upstash · Web3 Payments**

---

## 🏗️ Arquitectura

```
albion-crafting-hub/
├── app/
│   ├── (auth)/              # Rutas de autenticación (login, registro)
│   ├── admin/               # Panel admin (pagos + cupones + stats)
│   ├── api/
│   │   ├── admin/           # verify-payment, create-coupon, stats, payments
│   │   ├── auth/            # register, forgot-password, reset-password
│   │   ├── coupons/         # redeem
│   │   ├── payment/         # submit (tx_hash)
│   │   └── user/            # dashboard
│   ├── auth/                # forgot-password y reset-password (UI)
│   ├── calculadora/         # Calculadora master (refinado, comida, pociones)
│   ├── dashboard/           # Panel de usuario (referidos, cupones, suscripción)
│   └── pago/                # Flujo de pago Web3 (3 pasos)
├── components/
│   └── CalculatorForm.tsx   # Calculadora de refinado reutilizable
├── data/
│   ├── refining/            # JSON: metal, wood, stone, fiber, leather
│   ├── transmutation/       # JSON: costos de tier-up y enchant-up
│   ├── bags.json            # Recetas de bolsas
│   ├── food.json            # Recetas de comida
│   └── potions.json         # Recetas de pociones
├── lib/
│   ├── auth.ts              # NextAuth config (JWT + Credentials)
│   ├── calculations/        # Motores de cálculo tipados
│   ├── db.ts                # Wrapper Vercel Postgres
│   ├── email.ts             # Motor Resend (4 tipos de email)
│   ├── ratelimit.ts         # Rate limiters por endpoint (Upstash)
│   ├── referral.ts          # Motor de referidos (generación + premios)
│   └── validations.ts       # Schemas Zod para todos los inputs
├── scripts/
│   └── schema.sql           # Schema v4.0 (6 tablas + índices + función SQL)
├── src/types/
│   └── albion.ts            # Tipos de dominio (cero `any`)
└── types/
    └── next-auth.d.ts       # Extensión de tipos NextAuth
```

---

## 🚀 Setup Local

### 1. Clonar y instalar
```bash
git clone https://github.com/tu-usuario/albion-crafting-hub.git
cd albion-crafting-hub
npm install
```

### 2. Variables de entorno
```bash
cp .env.local.example .env.local
# Edita .env.local con tus credenciales reales
```

### 3. Base de datos
```bash
# En Vercel Dashboard → Storage → Postgres → Query
# Pega y ejecuta el contenido de scripts/schema.sql
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
# → http://localhost:3000
```

### 5. Verificar tipos
```bash
npm run type-check
```

---

## ☁️ Deploy en Vercel

### Variables de entorno requeridas en Vercel Dashboard:

| Variable | Descripción |
|---|---|
| `POSTGRES_URL` | Connection string de Vercel Postgres |
| `NEXTAUTH_SECRET` | Secret para JWT (min 32 chars) |
| `NEXTAUTH_URL` | URL pública de producción |
| `RESEND_API_KEY` | API key de Resend |
| `ADMIN_EMAIL` | Email del administrador |
| `UPSTASH_REDIS_REST_URL` | URL de Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Upstash Redis |
| `NEXT_PUBLIC_PAYMENT_ADDRESS` | Wallet EVM para recibir pagos |

---

## 🗄️ Schema de Base de Datos

El archivo `scripts/schema.sql` contiene las 6 tablas del MVP v4.0:

| Tabla | Propósito |
|---|---|
| `users` | Identidad, wallet, código de referido, role |
| `subscriptions` | Temporizador SaaS (expiry_date por usuario) |
| `coupons` | Cupones relámpago FOMO (48h) |
| `referral_rewards` | Registro de premios por referidos |
| `user_favorites` | Recetas favoritas con precios personalizados |
| `payments` | Auditoría de pagos Web3 (tx_hash on-chain) |

**Función SQL incluida:** `get_user_expiry(user_id)` — Calcula la expiración efectiva sumando suscripción base + días de referidos ganados.

---

## 💎 Flujo de Suscripción

```
Usuario se registra
    └─→ Trial 24h automático
    └─→ Código referido generado (Ej: ED-X7B9)

Usuario paga (tx_hash)
    └─→ Admin verifica en /admin
    └─→ Suscripción activada
    └─→ Email de confirmación enviado
    └─→ Referrer recibe 7 días gratis (si aplica)
    └─→ Email de premio al referrer

Cupones relámpago (admin)
    └─→ Creados con expiración de 48h (FOMO)
    └─→ Usuario canjea en /dashboard
    └─→ Días sumados a su suscripción actual
```

---

## 🔐 Seguridad

- **Validación Zod** en todas las API Routes y Server Actions
- **Rate limiting por endpoint** via Upstash Redis:
  - Auth: 5 req / 10 min
  - Cupones: 10 req / min
  - Pagos: 5 req / hora
- **Cero `any`** — tipado estricto en todo el codebase
- **Anti-enum de emails** en forgot-password (misma respuesta si existe o no)
- **Tokens de reset** con expiración de 1 hora y limpieza post-uso
- **bcrypt** con cost factor 10 para contraseñas

---

## ⏰ Cron Job — Notificaciones de expiración

El archivo `vercel.json` configura un cron que corre **todos los días a las 10:00 UTC**.

### Qué hace:
| Caso | Condición | Email enviado |
|---|---|---|
| Vence pronto | `effective_expiry` entre ahora+2d y ahora+4d | "Tu acceso vence en 3 días" |
| Venció hoy | `effective_expiry` en las últimas 26h | "Tu suscripción ha vencido" |

### Variables necesarias en Vercel:
- `CRON_SECRET` — Vercel lo genera automáticamente al configurar el cron. También puedes generarlo con `openssl rand -hex 32`.

### Probar manualmente en desarrollo:
```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" \
  http://localhost:3000/api/cron/expiry-check
```

### Respuesta exitosa:
```json
{
  "success": true,
  "timestamp": "2026-03-26T10:00:00Z",
  "results": {
    "expiring_3d_found": 5,
    "expiring_3d_sent": 5,
    "expiring_3d_errors": 0,
    "expired_found": 2,
    "expired_sent": 2,
    "expired_errors": 0,
    "duration_ms": 1240
  }
}
```

---

## 📧 Emails (Resend)

| Trigger | Destinatario | Descripción |
|---|---|---|
| Pago enviado | Admin | TX hash + datos del pago |
| Pago verificado | Usuario | Confirmación de suscripción activa |
| Suscripción expira (-3 días) | Usuario | Recordatorio de renovación |
| Premio de referido | Referrer | Días ganados + nuevo vencimiento |
| Recuperar contraseña | Usuario | Link seguro (1h expiración) |

---

## 🎯 Calculadoras disponibles

- **⚒️ Refinado** — T2–T8 con encantamientos .0/.1/.2/.3/.4, foco, bonus ciudad, premium
- **🍖 Comida** — Recetas completas con ajuste de lotes
- **🧪 Pociones** — Ingredientes por encantamiento (incluye Extractos de Arcano)
- **🎒 Bags** — Bolsas normales y Vision Bags con todos los enchantments
- **🔄 Transmutación** — Tier-up y enchant-up de recursos

---

## 📝 Licencia

Proyecto privado. No afiliado con Sandbox Interactive GmbH.
