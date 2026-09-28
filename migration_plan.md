# PRESOL CRM — Migration Plan
**Documento previo de arquitectura — Entregable 3 de 5**  
**Fecha:** 28 de Septiembre de 2026  
**Referencia:** `activity_upgrade_implementation.md` (Secciones 56, 77, 88)

---

## 1. Estrategia de Migración de Base de Datos

Se creará una nueva migración SQL idempotent:
`supabase/migrations/20260928010000_interaction_threads_and_events.sql`

### 1.1 Contenido de la Migración:
1. **Creación de `interaction_threads`:**
   - Tabla para agrupar hilos de conversación o gestiones vivas.
   - Columnas: `id`, `prospect_id`, `contact_id`, `owner_id`, `channel`, `subject`, `status`, `priority`, `last_event_at`, `last_inbound_at`, `last_outbound_at`, `opened_at`, `resolved_at`, `metadata`, `created_at`, `updated_at`.
   - Estados canónicos: `open`, `waiting_customer`, `action_required`, `scheduled`, `resolved`, `closed`.
   - Trigger `set_updated_at` para actualización automática de fecha.

2. **Creación de `interaction_events`:**
   - Registro inmutable de eventos por hilo.
   - Columnas: `id`, `thread_id`, `prospect_id`, `contact_id`, `activity_id`, `user_id`, `channel`, `event_type`, `interaction_state`, `result`, `direction`, `effective_contact`, `notes`, `provider`, `provider_event_id`, `occurred_at`, `created_at`, `metadata`.
   - Direcciones: `inbound`, `outbound`, `internal`.

3. **Ampliación de Tablas Existentes:**
   - `tasks`: agregar columna `interaction_thread_id uuid null references interaction_threads(id) on delete set null`.
   - `opportunities`: agregar columna `source_thread_id uuid null references interaction_threads(id) on delete set null`.

4. **Índices de Alto Rendimiento:**
   - `interaction_threads(status, last_event_at desc)`
   - `interaction_threads(prospect_id, status)`
   - `interaction_threads(owner_id, status)`
   - `interaction_events(thread_id, occurred_at desc)`
   - Índice único condicional `(provider, provider_event_id)` para deduplicación futura de webhooks.

5. **Seguridad (RLS):**
   - Habilitar RLS en `interaction_threads` e `interaction_events` con políticas alineadas al rol del usuario en `profiles`.

---

## 2. Estrategia de Datos Históricos (Backfill)
Siguiendo las directrices de la Sección 56 del documento de especificación:
- **No forzar reconstrucción de threads históricos:** Las actividades pasadas permanecen intactas en la tabla `activities` y en el timeline histórico.
- **Inicio operativo limpio:** Los threads se generarán a partir del despliegue en adelante con cada nueva interacción registrada.
- **Tolerancia a fallos:** El código de consulta de timeline y ficha soportará tanto actividades con thread asociado como actividades previas sin thread.

---

## 3. Plan de Implementación por Fases

### Fase 1 — Foundation (Fundación de Datos y Tipos)
- Archivo de migración SQL.
- Definición de tipos TypeScript compartidos (`src/types/interactions.ts`).
- Constantes y configuración de colas (`src/lib/interactions/config.ts`).
- Servicios base (`src/lib/interactions/service.ts` y `queries.ts`).

### Fase 2 — Flujo Manual y Smart Queues
- Actualizar `createActivity` en `src/app/actions/activities.ts` para orquestar la creación de thread y evento.
- Implementar la lógica de cálculo de Smart Queues (`requires_action`, `waiting_customer`, `no_response_24h`, `stale_48h`, `interested_without_next_action`, `quote_pending`, `overdue_tasks`).
- Acciones de servidor (`src/app/actions/interactions.ts`): registrar respuesta de cliente, resolver thread, reabrir thread.

### Fase 3 — Bandeja Comercial (`/inbox`)
- Ruta `/inbox` en App Router (`src/app/(crm)/inbox/page.tsx`).
- Tarjetas de resumen superior (Requieren acción, Esperando respuesta, Sin respuesta +24h, Tareas hoy, Vencidas).
- Sistema de Tabs con contadores en tiempo real.
- Componente `ThreadCard` accionable (altura compacta, botones contextuales: Respondió, Sin respuesta, Abrir WhatsApp, Llamar, Resolver).
- Modal rápido de "Respondió" para clasificar qué pasó en 2 clics.
- Feed cronológico "Actividad de hoy".
- Enlace en sidebar y navegación móvil.

### Fase 4 — Captura por Voz + Pipeline de IA
- Actualización de `POST /api/voice` para mapear directamente a la matriz V3 (`channel`, `interaction_state`, `result`, `effective_contact`, `next_action`).
- Componente de revisión con Human-in-the-loop (`VoiceActivityReviewModal`): muestra la actividad sugerida, contacto detectado, resultado y próxima acción, permitiendo editar o confirmar antes de persistir.
- Fallback tolerante a errores: si la IA falla o no tiene conexión, se permite la carga manual sin bloquear al vendedor.

### Fase 5 — Integración en Ficha del Prospecto
- Mostrar interacciones vivas/abiertas del prospecto en su ficha (`/prospects/[id]`).
- Quick actions contextuales con el contacto seleccionado.
- Timeline unificado deduplicado (no renderizar duplicados si un evento referencia a una actividad).

### Fase 6 — Métricas Operativas en Dashboard
- Incorporar contadores de la bandeja en el resumen del dashboard (`/dashboard`):
  - Interacciones abiertas.
  - Requieren acción.
  - Esperando respuesta (+24 h).

### Fase 7 — Hardening, Tests y Mobile
- Suite de pruebas unitarias automatizadas (`tests/interaction-threads.test.ts`).
- Verificación en responsive (Mobile 390x844 y Desktop 1440x900).
- Verificación de tipos (`next build --webpack`).
