# PRESOL CRM — Files to Modify
**Documento previo de arquitectura — Entregable 4 de 5**  
**Fecha:** 28 de Septiembre de 2026  
**Referencia:** `activity_upgrade_implementation.md` (Sección 88)

---

## 1. Archivos Nuevos

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/20260928010000_interaction_threads_and_events.sql` | DDL de `interaction_threads`, `interaction_events`, FKs en `tasks` y `opportunities`, índices y RLS. |
| `src/types/interactions.ts` | Definiciones de tipos TypeScript (`InteractionThread`, `InteractionEvent`, `ThreadStatus`, `SmartQueue`, etc.). |
| `src/lib/interactions/config.ts` | Configuración técnica de Smart Queues (`SMART_QUEUE_CONFIG`), umbrales de tiempo y mapeos. |
| `src/lib/interactions/service.ts` | Lógica de negocio para threads: matching de hilo activo, transición de estados, inserción de eventos. |
| `src/lib/interactions/queries.ts` | Funciones agregadas de consulta para la bandeja comercial y contadores de queues sin N+1. |
| `src/lib/ai/ai-provider.ts` | Abstracción de IA para transcripción, extracción estructurada según matriz V3 y sugerencias. |
| `src/app/actions/interactions.ts` | Server Actions para operaciones de thread: resolver, reabrir, registrar respuesta de cliente, crear tarea. |
| `src/app/(crm)/inbox/page.tsx` | Página principal de la Bandeja Comercial (`/inbox`). |
| `src/components/inbox/InboxSummaryCards.tsx` | Métricas superiores compactas (Requieren acción, Esperando, Sin respuesta +24h, Tareas hoy, Vencidas). |
| `src/components/inbox/InboxTabs.tsx` | Navegación por tabs con conteos activos. |
| `src/components/inbox/ThreadCard.tsx` | Card visual de thread compacta con botones contextuales y estado. |
| `src/components/inbox/ThreadQuickActionsModal.tsx` | Mini-modal contextual para clasificar rápidamente respuestas del cliente ("¿Qué pasó?"). |
| `src/components/inbox/ActivityTodayFeed.tsx` | Feed cronológico de eventos ocurridos en el día. |
| `src/components/inbox/VoiceActivityReviewModal.tsx` | Modal de revisión interactivo para notas de voz asistidas por IA (Human-in-the-loop). |
| `src/components/crm/v2/OpenInteractionsCard.tsx` | Card en la ficha de prospecto con las conversaciones activas. |
| `tests/interaction-threads.test.ts` | Suite de tests unitarios automatizados para reglas de threads y queues. |

---

## 2. Archivos Existentes a Modificar

| Archivo | Modificación |
|---|---|
| `src/app/actions/activities.ts` | Orquestar en `createActivity` la creación/actualización de `interaction_threads` e inserción en `interaction_events`. |
| `src/app/api/voice/route.ts` | Actualizar el prompt y schema estructurado de extracción para devolver la matriz V3 (`channel`, `interaction_state`, `result`, `next_action`). |
| `src/app/actions/voice.ts` | Conectar el guardado de la nota de voz estructurada con el servicio de actividades y threads. |
| `src/components/crm/voice-note-modal.tsx` | Enlazar el flujo de grabación con el modal de revisión interactivo antes del guardado definitivo. |
| `src/components/layout/sidebar.tsx` | Agregar el ítem de navegación "Bandeja comercial" (`/inbox`). |
| `src/app/(crm)/prospects/[id]/page.tsx` | Consultar los threads activos del prospecto e integrarlos en la vista de detalle. |
| `src/lib/dashboard/queries.ts` | Agregar función para obtener métricas operativas de la bandeja. |
| `src/components/dashboard/ExecutiveSummary.tsx` | Incorporar los contadores de interacciones que requieren acción en el resumen del dashboard. |

---

## 3. Garantía de No Regresión
Los archivos del núcleo comercial (`status-engine.ts`, `prospect-form.tsx`, cotizaciones, radar, giras y autenticación) se mantienen intactos o solo referenciados, preservando el 100% de la funcionalidad actual.
