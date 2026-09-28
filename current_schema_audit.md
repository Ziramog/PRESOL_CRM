# PRESOL CRM — Current Schema Audit
**Documento previo de arquitectura — Entregable 1 de 5**  
**Fecha:** 28 de Septiembre de 2026  
**Referencia:** `activity_upgrade_implementation.md` (Sección 88)

---

## 1. Resumen Ejecutivo
El modelo actual de PRESOL CRM almacena los sucesos comerciales principalmente en dos entidades:
1. `activities`: registros puntuales ("¿Qué ocurrió?"), recientemente enriquecidos en V3 con `channel`, `interaction_state`, `result` y `effective_contact`.
2. `tasks`: compromisos de seguimiento con fecha/hora (`due_at`).

El CRM carece actualmente de una entidad intermedia que represente la **conversación o gestión en curso** ("¿Qué interacción sigue viva y esperando respuesta?"), lo que obliga a los usuarios a recordar mentalmente o sobrecargar la tabla de `tasks` para saber qué conversaciones siguen abiertas.

---

## 2. Inventario de Tablas Relevantes

### 2.1 Tabla `activities`
Almacena el historial cronológico de actividades.
- **Identificador:** `id` (`uuid`, PK, `gen_random_uuid()`)
- **Relaciones principales:**
  - `prospect_id` (`uuid`, NOT NULL, FK `prospects.id` ON DELETE RESTRICT)
  - `trip_id` (`uuid`, NULL, FK `trips.id` ON DELETE SET NULL)
  - `trip_stop_id` (`uuid`, NULL, FK `trip_stops.id` ON DELETE SET NULL)
  - `contact_id` (`uuid`, NULL, FK `contacts.id` ON DELETE SET NULL)
  - `created_by` (`uuid`, NOT NULL, FK `profiles.id` ON DELETE RESTRICT)
- **Columnas de dominio existentes:**
  - `type` (`text`, NOT NULL — legacy: `visit`, `call`, `whatsapp`, `email`, `meeting`, `note`, `other`)
  - `outcome` (`text`, NULL — legacy)
  - `summary` (`text`, NULL)
  - `notes` (`text`, NULL)
  - `activity_at` (`timestamptz`, NOT NULL, DEFAULT `now()`, renombrada desde `occurred_at` en V2)
  - `created_at`, `updated_at`, `deleted_at` (`timestamptz`)
- **Columnas V3 agregadas recientemente (`20260928000000_activity_v3.sql`):**
  - `channel` (`text`, NULL — valores canónicos: `visit`, `call`, `whatsapp`, `email`, `virtual_meeting`, `internal_note`)
  - `interaction_state` (`text`, NULL — estado de interacción según canal)
  - `result` (`text`, NULL — resultado comercial según matriz)
  - `effective_contact` (`boolean`, NOT NULL, DEFAULT `false`)
- **Índices existentes:**
  - `activities_prospect_idx` (`prospect_id`, `activity_at DESC`)
  - `activities_trip_idx` (`trip_id`, `activity_at DESC`)
  - `activities_created_by_idx` (`created_by`, `activity_at DESC`)
  - `idx_activities_channel` (`channel`, `activity_at DESC`)
  - `idx_activities_effective_contact` (`effective_contact` WHERE `effective_contact IS TRUE`)

### 2.2 Tabla `contacts`
Almacena las personas estructuradas asociadas a una empresa.
- **Identificador:** `id` (`uuid`, PK)
- **Relaciones:** `prospect_id` (`uuid`, FK `prospects.id` ON DELETE CASCADE), `created_by` (`uuid`, FK `profiles.id`)
- **Columnas clave:** `full_name`, `role_title`, `phone`, `whatsapp`, `email`, `is_primary` (`boolean`, DEFAULT `false`), `notes`.
- **Índice:** `contacts_prospect_idx` (`prospect_id`).

### 2.3 Tabla `tasks`
Almacena compromisos concretos accionables con fecha de vencimiento.
- **Identificador:** `id` (`uuid`, PK)
- **Relaciones:** `prospect_id` (`uuid`), `trip_id` (`uuid`), `source_activity_id` (`uuid`, FK `activities.id`), `assigned_to` (`uuid`, FK `profiles.id`), `created_by` (`uuid`, FK `profiles.id`).
- **Columnas clave:**
  - `title` (`text`, NOT NULL)
  - `description` (`text`, NULL)
  - `type` (`text`, NOT NULL, DEFAULT `'follow_up'`)
  - `status` (`text`, NOT NULL, DEFAULT `'pending'` — valores: `pending`, `in_progress`, `completed`, `cancelled`)
  - `priority` (`text`, NOT NULL, DEFAULT `'normal'` — valores: `low`, `normal`, `high`, `urgent`)
  - `due_at` (`timestamptz`, NULL)
  - `completed_at` (`timestamptz`, NULL)
- **Índices:** `tasks_due_idx` (`status`, `due_at`), `tasks_assigned_idx` (`assigned_to`, `status`, `due_at`), `tasks_prospect_idx` (`prospect_id`, `status`).

### 2.4 Tabla `opportunities`
Almacena el pipeline de negocios potenciales.
- **Identificador:** `id` (`uuid`, PK)
- **Relaciones:** `prospect_id` (`uuid`), `source_activity_id` (`uuid`), `owner_id` (`uuid`, FK `profiles.id`).
- **Columnas clave:** `title`, `description`, `stage`, `estimated_value`, `expected_close_date`, `probability`.

### 2.5 Tabla `profiles`
Entidad de usuarios del CRM asociada a `auth.users`.
- `id` (`uuid`, PK, FK `auth.users.id`)
- `full_name`, `role` (`seller`, `admin`, `direction`, etc.).

---

## 3. Brechas Identificadas para la Bandeja Comercial Inteligente

1. **Falta de concepto `thread` (conversación viva):**
   Actualmente un WhatsApp o email saliente se registra en `activities`, pero queda "congelado". No existe una entidad que indique si ese hilo sigue esperando respuesta del cliente o si el cliente ya contestó y requiere acción del vendedor.
2. **Falta de eventos inmutables desacoplados (`interaction_events`):**
   Las actividades representan eventos de alto nivel cargados manualmente. Para soportar en el futuro webhooks de WhatsApp Business API, Gmail API o eventos automáticos sin corromper el histórico de auditoría, se requiere una tabla de eventos limpia con `direction` (`inbound`, `outbound`, `internal`), `event_type`, y referencias a proveedor (`provider`, `provider_event_id`).
3. **Ausencia de clave foránea en `tasks` y `opportunities` hacia threads:**
   Actualmente `tasks` solo conoce `source_activity_id`. Debe poder relacionarse opcionalmente con `interaction_thread_id` para resolver o enlazar tareas directamente a conversaciones vivas.

---

## 4. Conclusión del Schema Audit
El esquema actual está en óptimo estado y es 100% compatible para recibir la extensión de `interaction_threads` e `interaction_events` sin alterar ni romper ninguna tabla existente.
