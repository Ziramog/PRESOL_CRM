# Reporte de Arquitectura y Mapeo de Tablas (PRESOL Cost Engine)

## 1. Arquitectura Encontrada
- **Framework:** Next.js 16.3.4 (App Router)
- **UI:** React 19.2.8, TailwindCSS v4, Lucide React
- **Autenticación y Backend:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Estructura:**
  - `src/app/(crm)` contiene las rutas protegidas (dashboard, prospects, trips, tasks, opportunities, direction, settings).
  - `src/components/` contiene componentes de UI.
  - `src/lib/` contiene código utilitario (como se pide para `presol-cost-engine`).
- **Validación y Utilidades:** Zod, date-fns, xlsx.

## 2. Mapeo de Tablas Existentes
Revisamos las migraciones (`20260908000000_initial_schema.sql` y siguientes) para evitar duplicaciones:
- `clients`: El CRM actual utiliza la tabla `prospects` como entidad base de clientes. En las cotizaciones (`quotes`), vincularemos `client_id` con `prospects.id`.
- `roles/permisos`: El sistema usa `profiles` con una columna `role` (`'admin'`, `'direccion'`, `'comercial'`, `'viewer'`). Existe una función de RLS `public.current_user_role()`.
- `trips`: **¡Ya existe!** La tabla actual de `trips` se utiliza para planificar viajes y paradas de visita. Necesitamos alterarla en lugar de crearla desde cero, agregándole las columnas operativas y monetarias descritas en la especificación (`actual_km`, `actual_total_cost`, `quote_id`, etc.) cuidando de no romper su funcionamiento actual (ya tiene un campo `status` que incluye `draft`, `planned`, etc.).
- **Tablas a crear desde cero:** `cost_engine_versions`, `assets`, `personnel_costs`, `configurations`, `configuration_assets`, `configuration_personnel`, `pricing_parameters`, `operation_margin_rules`, `quotes`, `quote_cost_snapshots`.

## 3. Plan de Acción
1. **Migraciones:** Crear un archivo de migración para las nuevas entidades y alterar la tabla `trips`.
2. **Seeds:** Generar el archivo de seed con los datos del Excel V3.
3. **Core Engine:** Implementar `src/lib/presol-cost-engine` (cálculo puro + tests unitarios).
4. **UI Configuración:** Pantallas CRUD para administrar activos, personal, configs y parámetros.
5. **Cotizador:** Pantallas en `src/app/(crm)/quotes` para armar cotizaciones e interactuar con el backend (Server Actions).
