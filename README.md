# Judiziala — Portal Web

Sistema inteligente de monitoreo de procesos judiciales colombianos con análisis de documentos por IA.

---

## Tabla de contenido

1. [Propósito](#1-propósito)
2. [Contexto del producto](#2-contexto-del-producto)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura de rutas](#4-arquitectura-de-rutas)
5. [Pantallas del MVP](#5-pantallas-del-mvp)
6. [Sistema de diseño](#6-sistema-de-diseño)
7. [Autenticación OAuth](#7-autenticación-oauth)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Estructura del proyecto](#9-estructura-del-proyecto)
10. [Cómo ejecutar localmente](#10-cómo-ejecutar-localmente)
11. [Datos de ejemplo](#11-datos-de-ejemplo)
12. [Roadmap técnico](#12-roadmap-técnico)

---

## 1. Propósito

`portal-web` es la aplicación frontend del MVP de **Judiziala**, diseñada para abogados litigantes, firmas de abogados y departamentos jurídicos corporativos en Colombia.

**Problema que resuelve:** los profesionales del derecho pierden horas semanales revisando manualmente el portal de la Rama Judicial en busca de actuaciones nuevas, autos y notificaciones. Una notificación perdida puede representar el vencimiento de un término procesal, con consecuencias graves para el cliente.

**Propuesta de valor central:** Judiziala monitorea continuamente los procesos judiciales asignados, extrae el contenido de cada documento nuevo mediante IA, y presenta al abogado un resumen accionable en segundos — sin abrir el portal de la Rama Judicial.

---

## 2. Contexto del producto

| Dimensión | Detalle |
|---|---|
| Segmento objetivo | Abogados litigantes, firmas medianas, departamentos jurídicos corporativos en Colombia |
| Jurisdicción | Procesos civiles, laborales y administrativos ante la Rama Judicial colombiana |
| Fuente de datos | Portal `procesos.ramajudicial.gov.co` (scraping / integración futura) |
| Diferenciador IA | Resumen de autos, extracción de fechas procesales, detección de riesgos y próximos pasos |
| Fase actual | Auth prod (Google + sesiones DB); UI MVP con datos de ejemplo en dashboard |

---

## 3. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS v4 | 4.x |
| Componentes | shadcn/ui | 4.x |
| Autenticación | NextAuth v5 (Auth.js) + Prisma Adapter | 5.0.0-beta |
| Base de datos | Supabase Postgres + Prisma | 7.x |
| Hosting prod | Vercel (`judiziala.co`) | — |
| Iconografía | Lucide React | latest |
| Gráficas | Recharts | latest |
| Fechas | date-fns | latest |
| Sistema de color | OKLCH con tokens semánticos CSS | — |

---

## 4. Arquitectura de rutas

```
app/
  (auth)/
    login/                         OAuth Google
    sesion-cerrada/                Sesión revocada (otro dispositivo)
  (dashboard)/
    layout.tsx                     Protegido: sidebar + header
    dashboard/                     Resumen ejecutivo
    procesos/                      Lista y detalle de procesos
    documentos/                    Visor + análisis IA
    alertas/                       Centro de notificaciones
    configuracion/sesiones/        Sesión activa + cerrar en todos lados
  api/
    auth/[...nextauth]/            NextAuth v5 handlers
    heartbeat/                     POST latido de presencia
    session/                       GET sesión actual; POST logout-all
```

Las rutas bajo `(dashboard)` están protegidas por [`middleware.ts`](middleware.ts). Sin sesión válida → `/login`.

---

## 5. Pantallas del MVP

### 5.1 Dashboard (`/dashboard`)
Vista de mando para el abogado. Muestra:
- Saludo contextual con resumen de actividad del día
- Métricas inline: procesos activos, actuaciones nuevas, alertas pendientes
- Tabla de procesos críticos con radicado, despacho, última actuación y estado
- Feed de alertas recientes con niveles de urgencia (urgente / advertencia / info)

### 5.2 Lista de procesos (`/procesos`)
Inventario completo de los procesos bajo monitoreo. Incluye:
- Radicado, partes (demandante vs. demandado), despacho
- Estado del proceso (activo / en despacho / urgente / suspendido / archivado)
- Fecha de última actuación
- Contador de alertas activas por proceso

### 5.3 Timeline procesal (`/procesos/[id]`)
Vista detallada de un proceso individual. Contiene:
- Encabezado con radicado, partes, despacho y jurisdicción
- Timeline vertical cronológico con nodos por actuación
- Cada nodo muestra: tipo de actuación, descripción, fecha y enlace al documento
- Panel lateral con estadísticas del proceso y próxima fecha de audiencia

### 5.4 Vista de documento (`/documentos/[id]`)
Layout dividido 50/50 para la revisión de documentos judiciales:
- **Izquierda:** visor del documento con paginación
- **Derecha:** panel de análisis IA con 4 pestañas:
  - *Resumen* — decisión del juez en lenguaje claro
  - *Fechas* — fechas importantes extraídas del documento
  - *Riesgos* — alertas de posibles consecuencias procesales
  - *Pasos* — próximas acciones recomendadas
- Skeleton animado mientras el análisis "carga" (simulado en el MVP)

### 5.5 Centro de alertas (`/alertas`)
Bandeja de notificaciones con:
- Filtros por tipo: todas, sin leer, urgentes, advertencias, información
- Contadores por categoría
- Acción de marcar como leída (individual o todas a la vez)
- Enlace directo al proceso relacionado con cada alerta

### 5.6 Login (`/login`)
Pantalla de autenticación minimalista:
- Acceso con Google OAuth (principal)
- Enlace de acceso en modo demo (sin OAuth configurado)

---

## 6. Sistema de diseño

El proyecto utiliza el protocolo **Impeccable** para garantizar calidad visual de producción.

### Tokens semánticos CSS (OKLCH)

Todos los colores se definen como variables CSS en `src/app/globals.css` bajo el sistema OKLCH con neutrales tintados hacia el tono de marca (hue 250 grados):

| Token | Uso |
|---|---|
| `--canvas` | Fondo base de la aplicación |
| `--surface` | Tarjetas, paneles, contenedores |
| `--sunken` | Areas hundidas, fondos de inputs |
| `--line` / `--line-strong` | Bordes y divisores |
| `--ink` / `--ink-muted` / `--ink-subtle` | Jerarquía tipográfica (3 niveles) |
| `--brand` / `--brand-hover` | Acciones primarias |
| `--brand-soft` / `--brand-ink` | Fondos y texto de énfasis de marca |
| `--success/danger/warning/info` | Estados semánticos |
| `--*-soft` / `--*-ink` | Variantes de fondo y texto por estado |

### Principios de diseño aplicados
- Sin colores hex directos en componentes (todo via tokens)
- Sin rayas de borde lateral para indicar estado
- Sin cuadrículas de tarjetas KPI idénticas en dashboard
- Tipografía con jerarquía de 3 niveles de opacidad
- Espaciado consistente en la escala de 4px

---

## 7. Autenticación OAuth

Producción en **https://judiziala.co** (Vercel) con **NextAuth v5**, proveedor **Google únicamente** y **sesiones en base de datos** (Supabase Postgres vía Prisma). No JWT en prod.

### Proveedores

| Entorno | Provider | Estrategia de sesión |
|---|---|---|
| **Producción** | Google OAuth | `database` (tabla `Session`) |
| **Desarrollo** | Google OAuth | `database` |
| **Dev + demo** | Google + Credentials `demo` | JWT solo si `NEXT_PUBLIC_DEMO_MODE=true` |

GitHub OAuth fue retirado. Demo/Credentials **no** se despliegan en producción (`NEXT_PUBLIC_DEMO_MODE=false`).

### Sesiones DB y sesión única

- Cookie `authjs.session-token` → fila en `Session` (Prisma Adapter).
- **Sesión única:** un nuevo login revoca las anteriores del mismo usuario (`revokedAt`).
- Metadatos por sesión: `userAgent`, `ipHash` (nunca IP en claro), `device`, `lastSeenAt`.
- Expiración: **idle 30 min** sin heartbeat, **absoluta 12 h** (`expires`).
- Auditoría en tabla `AccessAuditLog`: login, deny, revoke, cambio IP (`src/lib/auth/audit.ts`).

### Heartbeat de presencia

Cliente [`heartbeat-provider.tsx`](src/components/auth/heartbeat-provider.tsx):

- Latido cada **~45 s** solo con pestaña visible (Page Visibility API).
- Una pestaña líder emite el ping (Web Locks API).
- `sendBeacon` al cerrar pestaña.

| Método | Endpoint | Función |
|---|---|---|
| POST | `/api/heartbeat` | Actualiza `lastSeenAt`; `401` si revocada/idle/expirada |
| GET | `/api/session` | Sesión actual (dispositivo, última actividad) |
| POST | `/api/session/logout-all` | Revoca todas las sesiones del usuario |

Si el heartbeat detecta `session_revoked` → `signOut()` y redirige a `/sesion-cerrada`.

### Cookies seguras

En prod (`AUTH_URL=https://…`): `HttpOnly`, `Secure`, `SameSite=Lax` — ver [`secure-cookies.ts`](src/lib/auth/secure-cookies.ts).

### Archivos clave

| Archivo | Descripción |
|---|---|
| [`src/auth.ts`](src/auth.ts) | Providers, adapter, callbacks, eventos, cookies |
| [`src/auth.config.ts`](src/auth.config.ts) | Config Edge-safe para middleware |
| [`middleware.ts`](middleware.ts) | Protección de rutas + rate-limit API auth/heartbeat |
| [`src/lib/auth/single-session.ts`](src/lib/auth/single-session.ts) | Adapter: revoca sesiones previas al crear una nueva |
| [`src/lib/auth/heartbeat.ts`](src/lib/auth/heartbeat.ts) | Lógica del latido |
| [`src/lib/auth/audit.ts`](src/lib/auth/audit.ts) | Auditoría de accesos |
| [`prisma/schema.prisma`](prisma/schema.prisma) | `User`, `Session`, `AccessAuditLog`, `Allowlist` |

### Modo demo (solo desarrollo local)

Con `NEXT_PUBLIC_DEMO_MODE=true`, login muestra acceso demo (JWT, sin sesiones DB). No usar para probar sesión única ni heartbeat.

### Despliegue (Vercel + Supabase)

| Componente | Dónde |
|---|---|
| App Next.js | Vercel → `judiziala.co` |
| Postgres | Supabase (pooler `:6543` runtime, directo `:5432` migraciones) |
| OAuth Google | GCP Console (redirect URIs prod + local) |
| Secretos | Vercel Environment Variables (Sensitive) |
| Migraciones | GitHub Actions [`.github/workflows/prisma-migrate.yml`](.github/workflows/prisma-migrate.yml) |

Scripts de verificación: `npm run verify:oauth-prod`, `verify:supabase-prod`, `verify:auth-observability`.

### Rate limiting (MVP)

El middleware aplica límites in-memory en Edge para reducir abuso de endpoints sensibles:

| Bucket | Rutas | Límite | Ventana |
|---|---|---|---|
| `heartbeat` | `POST /api/heartbeat` | 4 req | 60 s |
| `auth` | `/api/auth/signin`, `callback`, `csrf`, `providers`, `error` | 20 req | 10 min |

Respuesta al exceder el límite: `429` con `{ "error": "rate_limited" }` y header `Retry-After`.

Variables opcionales: `AUTH_RL_HEARTBEAT_MAX`, `AUTH_RL_HEARTBEAT_WINDOW_MS`, `AUTH_RL_AUTH_MAX`, `AUTH_RL_AUTH_WINDOW_MS`.

**Limitación:** en Vercel cada instancia Edge mantiene su propio contador (no es global). Mitiga bots simples y spam casual; no sustituye protección DDoS.

### Observabilidad auth (free tier)

Métricas estructuradas en JSON vía `src/lib/auth/auth-metrics.ts` (sin Vercel Pro ni Supabase Pro):

| Métrica | Cuándo |
|---|---|
| `auth.oauth` | Login OK, deny (allowlist), errores NextAuth |
| `auth.heartbeat` | Cada POST con `durationMs` y `status` |
| `auth.rate_limit` | Respuesta 429 del middleware |

Activo en `NODE_ENV=production`. En dev: `AUTH_METRICS_ENABLED=true`.

**Ver logs:** Vercel Dashboard → Logs → filtrar `"metric":"auth.heartbeat"` o `"metric":"auth.oauth"`. Retención corta en plan Hobby.

**Smoke p95 post-deploy:**

```bash
npm run verify:auth-observability
# local: AUTH_OBS_BASE_URL=http://localhost:3000 npm run verify:auth-observability
```

Variables opcionales: `AUTH_OBS_BASE_URL`, `AUTH_OBS_SAMPLES` (default 20), `AUTH_OBS_P95_MAX_MS` (default 800).

Eventos de negocio (login/deny/revoke/IP) siguen en tabla `AccessAuditLog` (5.3); consultables con SQL en Supabase free.

**Evolución post-MVP:** Vercel Pro + Log Drain (Axiom) para p95 histórico y alertas.

### Evolución — Upstash Redis (post-MVP)

Para límites distribuidos entre instancias:

1. Crear base Redis en [Upstash](https://upstash.com/) (región cercana al deploy Vercel).
2. Instalar `@upstash/ratelimit` y `@upstash/redis`.
3. Añadir env vars `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en Vercel.
4. En `src/lib/auth/edge-rate-limit.ts`, reemplazar el `Map` in-memory por `Ratelimit.slidingWindow()`; mantener fallback in-memory si faltan las env vars.
5. Verificar con curls repetidos (5 POST a `/api/heartbeat` → el 5.º debe devolver 429).

---

## 8. Variables de entorno

Copiar [`.env.production.example`](.env.production.example) como referencia. En local, crear `.env.local` (no versionar).

### Desarrollo (`.env.local`)

```env
# Auth
AUTH_SECRET=                          # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Supabase — runtime pooler :6543
DATABASE_URL=postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true
# Migraciones locales/CI — directo :5432
DIRECT_URL=postgresql://...@...supabase.com:5432/postgres

# Demo JWT local (opcional; desactivar para probar sesiones DB)
NEXT_PUBLIC_DEMO_MODE=false
```

### Producción (Vercel Environment Variables)

```env
AUTH_URL=https://judiziala.co
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_DEMO_MODE=false
DATABASE_URL=                         # pooler :6543 + pgbouncer=true
```

`DIRECT_URL` solo en **CI/local** para `prisma migrate deploy` — no en runtime Vercel.

Variables opcionales de hardening: `AUTH_RL_*` (rate-limit), `AUTH_METRICS_ENABLED`, `AUTH_OBS_*` (smoke observabilidad). **Nunca** `E2E_ENABLED` en prod.

### OAuth Google (GCP)

| Entorno | Redirect URI |
|---|---|
| Local | `http://localhost:3000/api/auth/callback/google` |
| Prod | `https://judiziala.co/api/auth/callback/google` |

JavaScript origins: `http://localhost:3000`, `https://judiziala.co`.

Validación al arrancar: [`src/lib/env.ts`](src/lib/env.ts) (Zod).

### Base de datos

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones (usa DIRECT_URL)
npm run db:migrate:deploy
```

Runtime de la app usa **solo** `DATABASE_URL` (pooler). No usar pooler para DDL.

---

## 9. Estructura del proyecto

```
portal-web/
  src/
    app/
      (auth)/
        login/page.tsx
      (dashboard)/
        layout.tsx
        dashboard/page.tsx
        procesos/
          page.tsx
          [id]/page.tsx
        documentos/[id]/page.tsx
        alertas/page.tsx
      api/auth/[...nextauth]/route.ts
      globals.css
      layout.tsx
    auth.ts
    components/
      layout/
        dashboard-shell.tsx
        header.tsx
        sidebar.tsx
        sidebar-context.tsx
      ui/                      Componentes shadcn/ui
    lib/
      mock-data.ts             Datos de ejemplo del MVP
      utils.ts
  middleware.ts
  PRODUCT.md                   Contexto de producto para Impeccable
  DESIGN.md                    Tokens y dirección visual para Impeccable
  .env.local                   Variables de entorno (no versionar)
  next.config.ts
  tailwind.config.ts
  tsconfig.json
```

---

## 10. Cómo ejecutar localmente

**Requisitos previos:** Node.js 20+, npm 10+

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Crear .env.local (ver §8): DATABASE_URL, DIRECT_URL, AUTH_SECRET, Google OAuth

# 3. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

Para ingresar sin OAuth configurado, activar `NEXT_PUBLIC_DEMO_MODE=true` y usar el enlace de acceso demo en la pantalla de login.

### Tests E2E auth

Requiere Supabase dev configurada en `.env.local` (`DATABASE_URL`, `AUTH_SECRET`, credenciales Google).

```bash
# Instalar navegador (una vez)
npx playwright install chromium

# Ejecutar suite auth (arranca dev con E2E_ENABLED=true)
npm run test:e2e
```

La suite usa `e2e@judiziala.local` y limpia datos al inicio (`e2e/global-setup.ts`). Mock de Google vía `POST /api/e2e/mock-google-login` (solo con `E2E_ENABLED=true`, nunca en prod).

CI manual: workflow `.github/workflows/e2e-auth.yml` (`workflow_dispatch`).

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Verificar reglas de ESLint |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E auth (Playwright) |
| `npm run test:e2e:ui` | Playwright UI mode |

---

## 11. Datos de ejemplo

El MVP utiliza datos hardcodeados definidos en `src/lib/mock-data.ts`. No requiere base de datos ni backend para funcionar.

| Colección | Contenido |
|---|---|
| `mockProcesos` | 5 procesos judiciales en distintos estados |
| `mockActuaciones` | 7 actuaciones procesales con timeline |
| `mockDocumento` | 1 auto interlocutorio con análisis IA completo |
| `mockAlertas` | 6 alertas de distintos tipos y niveles de urgencia |

---

## 12. Roadmap técnico

Las siguientes funcionalidades están planificadas para fases posteriores al MVP:

| Fase | Funcionalidad |
|---|---|
| v0.2 | Integración con API de la Rama Judicial (scraping real) |
| — | Base de datos auth (Supabase + Prisma) — implementado |
| v0.3 | Procesamiento real de documentos PDF con IA (OpenAI / Anthropic) |
| v0.3 | Sistema de notificaciones por email y WhatsApp |
| v0.4 | Agregar e importar procesos por radicado |
| v0.4 | Exportación de reportes en PDF |
| v1.0 | Multi-tenant (gestión por firma de abogados) |
| v1.0 | Facturación y planes de suscripción |

---

*Judiziala — Tus procesos, vigilados.*
