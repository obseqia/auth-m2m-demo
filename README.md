# obseqia-m2m-demo

Demo de autenticación **Machine-to-Machine (M2M)** con [Clerk](https://clerk.com) en una aplicación Next.js. Valida el patrón de obtener y cachear tokens JWT de corta duración para hacer llamadas autenticadas a un API backend desde el servidor.

## Qué hace

Esta aplicación demuestra cómo un frontend Next.js puede llamar a un backend protegido **sin ningún usuario logueado**, usando tokens M2M de Clerk:

1. La página `/checkout?order_id=<id>` recibe un `order_id` como query param.
2. Un Server Action solicita a Clerk un token JWT de corta duración (10 segundos) usando una `CLERK_MACHINE_SECRET_KEY`.
3. El token se cachea en memoria del servidor con lógica de refresco concurrente: si varias peticiones llegan a la vez mientras el token está vencido, solo se genera uno solo (deduplicación con una promesa compartida).
4. El token se inyecta como `Authorization: Bearer <token>` en una llamada `GET` al backend (`BACKEND_ENDPOINT/restaurant/checkout/clover/<id>`).
5. La respuesta del backend se muestra en pantalla.

## Arquitectura del flujo M2M

```
Browser
  │
  └─▶ Next.js Server (RSC / Server Action)
          │
          ├─▶ lib/auth.ts · getM2MToken()
          │       ├── Token en caché y vigente? → devuelve token cacheado
          │       ├── Refresh en curso?          → espera la promesa activa
          │       └── Sin token / vencido        → llama a Clerk API
          │               └─▶ client.m2m.createToken({ secondsUntilExpiration: 10 })
          │
          └─▶ Backend API (BACKEND_ENDPOINT)
                  Authorization: Bearer <jwt>
```

## Variables de entorno

Crea un archivo `.env.local` con:

```env
# Clave secreta M2M de tu aplicación Clerk (Clerk Dashboard → Machine Tokens)
CLERK_MACHINE_SECRET_KEY=m2m_...

# URL base del backend que protege Clerk (sin slash final)
BACKEND_ENDPOINT=https://tu-backend.example.com
```

## Estructura relevante

```
src/
├── lib/
│   └── auth.ts                        # Lógica de caché y obtención del token M2M
└── app/
    ├── actions/
    │   └── getCloverCheckout.ts       # Server Action: llama al backend con el token
    └── checkout/
        ├── page.tsx                   # Página que dispara la acción y muestra el resultado
        └── loading.tsx                # Estado de carga de React Suspense
```

## Detalles de implementación notables

- **Token de 10 s**: Los tokens M2M se emiten con `secondsUntilExpiration: 10`. El caché los renueva 5 s antes del vencimiento (`REFRESH_SKEW_MS = 5_000`) para evitar usar un token a punto de expirar.
- **Deduplicación de refresco**: Si el token está vencido y llegan varias requests simultáneas, solo se hace una llamada a Clerk. El resto espera la misma promesa (`refreshPromise`).
- **`server-only`**: El módulo `lib/auth.ts` importa `server-only` para que el bundler bloquee cualquier importación accidental desde el cliente.

## Cómo correr el proyecto

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000/checkout?order_id=<id>` para probar el flujo completo.

## Stack

- [Next.js 16](https://nextjs.org) con App Router
- [Clerk](https://clerk.com) — `@clerk/nextjs` + `@clerk/backend`
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript, pnpm
