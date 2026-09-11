# Resumen de Archivos Modificados - PRESOL Cost Engine

## Base de Datos (Migraciones)
- `supabase/migrations/20260910000002_cost_engine.sql`: Tablas del modelo de costos y alteración de `trips`.
- `supabase/migrations/20260910000003_cost_engine_seeds.sql`: Datos semilla de versiones, activos, personal, configuraciones y reglas de márgenes extraídas del Excel V3.

## Core Engine
- `src/lib/presol-cost-engine/types.ts`: Tipos del motor.
- `src/lib/presol-cost-engine/calculate-quote.ts`: Función pura con toda la matemática económica (distancia, horas, hidrogrúa, margen, etc).
- `src/lib/presol-cost-engine/calculate-quote.test.ts`: Tests ejecutables que validan que el motor da el mismo resultado que Excel.
- `src/lib/presol-cost-engine/repository.ts`: Capa de datos para cargar las variables del modelo de forma estructurada.

## Server Actions
- `src/app/actions/costs/admin.ts`: CRUD operations para pantallas de configuración de costos.
- `src/app/actions/quotes/calculateQuote.ts`: Valida input del usuario y consume la función de cálculo devolviendo resultados en vivo (y snapshots intermedios).
- `src/app/actions/quotes/createQuote.ts`: Orquesta la transacción para generar el número de cotización, insertar y crear el snapshot inmutable.
- `src/app/actions/quotes/convertQuoteToTrip.ts`: Flujo para convertir cotizaciones aceptadas en operaciones planeadas.

## Vistas UI (React)
- **Configuraciones de Costos (Admin)**
  - `src/app/(crm)/settings/costs/assets/page.tsx`
  - `src/app/(crm)/settings/costs/personnel/page.tsx`
  - `src/app/(crm)/settings/costs/configurations/page.tsx`
  - `src/app/(crm)/settings/costs/parameters/page.tsx`
- **Módulo de Cotizaciones**
  - `src/app/(crm)/quotes/page.tsx`: Lista principal de cotizaciones.
  - `src/app/(crm)/quotes/new/page.tsx`: Página para generar nueva cotización.
  - `src/components/crm/quotes/QuoteForm.tsx`: Componente interactivo principal con input en tiempo real y panel de resumen con semáforo.
  - `src/app/(crm)/quotes/[id]/page.tsx`: Vista de detalle de una cotización y su paso a "viaje".
- **Layout**
  - `src/components/layout/sidebar.tsx`: Actualizado con acceso a `/quotes`.

## Artefactos de Análisis
- `cost_engine_architecture_report.md`: Breve análisis para alinear el requerimiento a la arquitectura existente.

*Todos los requerimientos hasta el MVP han sido implementados y probados. Pruebas TS pasadas y build generado correctamente.*
