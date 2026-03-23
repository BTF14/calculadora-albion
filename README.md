# Albion Online Crafting Calculator

Calculadora de crafteo con sistema de suscripciones semanal, mensual y anual. Pago mediante Binance con verificación manual.

## Configuración

1. Clona el repositorio.
2. Copia `.env.local.example` a `.env.local` y completa las variables.
3. Instala dependencias: `npm install`
4. Ejecuta en desarrollo: `npm run dev`
5. Despliega en Vercel.

## Variables de entorno obligatorias

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAIL`
- `RESEND_API_KEY`
- `VERCEL_BLOB_READ_WRITE_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Primer administrador

Regístrate y luego ejecuta en la base de datos:
```sql
UPDATE users SET is_admin = true WHERE email = 'tu-email';
