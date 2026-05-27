# Judiziala — Design System

## Paleta de colores
- Primario: #1E3A5F (azul oscuro institucional)
- Primario claro: #2E5A8F
- Fondo: #F8FAFC (casi blanco)
- Superficie: #FFFFFF
- Borde: #E2E8F0
- Texto primario: #0F172A
- Texto secundario: #64748B
- Acento verde: #22C55E (alertas positivas, proceso activo)
- Acento rojo: #EF4444 (urgente, riesgo alto)
- Acento amarillo: #F59E0B (advertencia, término próximo)
- Acento azul: #3B82F6 (información)

## Tipografía
- Familia: Inter (Google Fonts)
- Tamaños: 12 / 14 / 16 / 20 / 24 / 32 / 48
- Pesos: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## Espaciado
- Basado en múltiplos de 4px
- Cards: padding 24px
- Secciones: gap 16px / 24px
- Página: max-width 1280px, padding horizontal 24px

## Estilo visual
- Data-dense pero limpio — mucha información sin verse cargado
- Inspiración: Linear.app, Vercel Dashboard, Notion
- Bordes sutiles (#E2E8F0), sombras mínimas
- Iconografía: Lucide React (stroke, no fill)
- Badges con colores semánticos para estados
- Tablas con hover states

## Estados de proceso
- Activo: badge verde
- En despacho: badge azul
- Suspendido: badge amarillo
- Archivado: badge gris
- Urgente: badge rojo con ícono de alerta

## Componentes clave
- Sidebar izquierdo fijo, 240px de ancho
- Header con búsqueda global + notificaciones + avatar
- Cards con estadísticas KPI (número grande + etiqueta + delta)
- Timeline vertical con línea conectora y nodos circulares
- Split panel 50/50 para vista de documentos
