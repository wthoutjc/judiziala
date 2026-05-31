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
| Fase actual | MVP navegable con datos de ejemplo (sin backend real) |

---

## 3. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS v4 | 4.x |
| Componentes | shadcn/ui | 4.x |
| Autenticación | NextAuth v5 (beta) | 5.0.0-beta |
| Iconografía | Lucide React | latest |
| Gráficas | Recharts | latest |
| Fechas | date-fns | latest |
| Sistema de color | OKLCH con tokens semánticos CSS | — |

---

## 4. Arquitectura de rutas

```
app/
  (auth)/
    login/                   Pantalla de inicio de sesión OAuth
  (dashboard)/
    layout.tsx               Layout protegido: sidebar + header
    dashboard/               Resumen ejecutivo y alertas recientes
    procesos/
      page.tsx               Lista de todos los procesos monitoreados
      [id]/page.tsx          Vista detallada: timeline procesal
    documentos/
      [id]/page.tsx          Vista PDF + panel de análisis IA
    alertas/                 Centro de notificaciones y alertas
  api/
    auth/[...nextauth]/      Handlers de NextAuth v5
```

Las rutas bajo `(dashboard)` están protegidas por middleware. Cualquier visita sin sesión activa redirige automáticamente a `/login`.

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

El proyecto usa **NextAuth v5** con estrategia JWT (sin base de datos en el MVP).

### Proveedores configurados
- **Google OAuth** — único proveedor OAuth (producción y desarrollo)

### Archivos clave

| Archivo | Descripción |
|---|---|
| `src/auth.ts` | Configuración central: providers, callbacks, session strategy |
| `middleware.ts` | Protección de rutas (ejecuta en el Edge Runtime) |
| `src/app/api/auth/[...nextauth]/route.ts` | Route handler de NextAuth |

### Modo demo (desarrollo sin OAuth)
Si `NEXT_PUBLIC_DEMO_MODE=true` en `.env.local`, la pantalla de login muestra un enlace de acceso directo que omite OAuth. Útil para desarrollo local sin credenciales configuradas.

---

## 8. Variables de entorno

Crear el archivo `.env.local` en la raíz del proyecto:

```env
# NextAuth — genera un secreto con: openssl rand -base64 32
AUTH_SECRET=tu-secreto-aqui

# Google OAuth — https://console.cloud.google.com/
AUTH_GOOGLE_ID=tu-google-client-id
AUTH_GOOGLE_SECRET=tu-google-client-secret

# Modo demo para desarrollo sin OAuth configurado
NEXT_PUBLIC_DEMO_MODE=true
```

**URL de callback OAuth para desarrollo local:**
- Google: `http://localhost:3000/api/auth/callback/google`

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
cp .env.local.example .env.local
# Editar .env.local con tus credenciales OAuth

# 3. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

Para ingresar sin OAuth configurado, activar `NEXT_PUBLIC_DEMO_MODE=true` y usar el enlace de acceso demo en la pantalla de login.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Verificar reglas de ESLint |

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
| v0.2 | Base de datos (PostgreSQL + Prisma) para persistencia |
| v0.3 | Procesamiento real de documentos PDF con IA (OpenAI / Anthropic) |
| v0.3 | Sistema de notificaciones por email y WhatsApp |
| v0.4 | Agregar e importar procesos por radicado |
| v0.4 | Exportación de reportes en PDF |
| v1.0 | Multi-tenant (gestión por firma de abogados) |
| v1.0 | Facturación y planes de suscripción |

---

*Judiziala — Tus procesos, vigilados.*
