# PRESOL CRM — IMPLEMENTATION.md
## Bandeja Comercial Inteligente + Interaction Threads + Smart Queues + Captura Manual/Voz + IA

**Estado:** listo para implementación  
**Objetivo:** evolucionar PRESOL CRM desde un registro de actividades hacia una **bandeja de trabajo comercial operativa**, sin romper el CRM actual y dejando preparada la arquitectura para integrar posteriormente WhatsApp Business Platform, email y otros canales automáticos.

---

# 1. PRINCIPIO CENTRAL

El CRM debe distinguir cuatro conceptos:

```text
ACTIVIDAD
¿Qué ocurrió?

INTERACCIÓN
¿Qué conversación o gestión sigue abierta?

TAREA
¿Qué debemos hacer y cuándo?

OPORTUNIDAD
¿Qué negocio estamos intentando cerrar?
```

La actividad deja de ser un registro muerto. Puede crear o actualizar una **interacción viva**, que permanece visible hasta resolverse.

Ejemplo:

```text
WhatsApp enviado
→ esperando respuesta
→ respondió
→ pidió información
→ requiere acción
→ resuelto
```

Nunca borrar ni sobrescribir los eventos anteriores.

---

# 2. OBJETIVO DE PRODUCTO

La pantalla operativa debe responder:

> **¿Qué necesita mi atención ahora?**

Vista esperada:

```text
MI DÍA

Requieren acción          4
Esperando respuesta       8
Sin respuesta +24 h       6
Tareas de hoy             5
Vencidas                  2
```

Debajo, cards accionables:

```text
CESCA Hnos.
WhatsApp · hace 18 min

Respondió:
"Mandame información del carretón"

[ Enviar información ]
[ Llamar ]
[ Crear tarea ]
[ Abrir WhatsApp ]
```

La primera versión debe funcionar con captura manual y voz. Más adelante los mismos threads y eventos deben alimentarse automáticamente desde APIs externas.

---

# 3. ARQUITECTURA GENERAL

```text
                    PRESOL CRM
                        │
                        ▼
                 CAPTURA DE EVENTOS
                        │
       ┌────────────────┼────────────────┐
       │                │                │
    Manual           Nota voz       API futura
       │                │        WhatsApp / Email
       └────────────────┼────────────────┘
                        ▼
                  ACTIVITY EVENTS
                        │
                        ▼
               INTERACTION THREADS
                        │
                        ▼
                  SMART QUEUES
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
        TASKS                    OPPORTUNITIES
          │
          └──────────────┬────────────┘
                         ▼
                         IA
            resumen / clasificación /
             sugerencias / extracción
```

---

# 4. CAPAS FUNCIONALES

## 4.1 Captura

Fuentes actuales:

- formulario manual;
- nota de voz;
- botones rápidos del prospecto;
- visita;
- llamada;
- WhatsApp;
- email;
- nota interna.

Fuentes futuras:

- WhatsApp Business Platform;
- Gmail API;
- Microsoft Graph;
- telefonía/VoIP;
- formularios web.

La fuente de captura no debe cambiar el modelo de dominio.

## 4.2 Eventos

Cada hecho queda como evento inmutable:

- WhatsApp enviado;
- cliente respondió;
- email enviado;
- llamada sin respuesta;
- visita realizada;
- pidió información;
- pidió cotización;
- cotización enviada;
- thread resuelto.

## 4.3 Interaction Threads

Un thread representa una conversación/gestión comercial vigente:

```text
Prospecto: CESCA Hnos.
Contacto: Juan Pablo Luque
Canal: WhatsApp
Tema: Presentación PRESOL
Estado: WAITING_CUSTOMER
```

Puede contener múltiples eventos.

## 4.4 Smart Queues

Las colas son vistas derivadas:

- Requieren acción;
- Esperando respuesta;
- Sin respuesta +24 h;
- Interesados sin próxima acción;
- Cotizaciones pendientes;
- Oportunidades sin movimiento;
- Tareas vencidas.

No crear una tabla por cola.

## 4.5 Tasks

Task = compromiso concreto con fecha/hora.

No crear una tarea por cada WhatsApp o email.

## 4.6 Opportunities

Opportunity = negocio potencial. No confundir con interacción.

---

# 5. TABLA `interaction_threads`

```sql
create table interaction_threads (
  id uuid primary key default gen_random_uuid(),

  prospect_id uuid not null references prospects(id) on delete cascade,
  contact_id uuid null references contacts(id) on delete set null,
  owner_id uuid null references auth.users(id) on delete set null,

  channel text not null,
  subject text null,

  status text not null default 'open',
  priority text null,

  last_event_at timestamptz null,
  last_inbound_at timestamptz null,
  last_outbound_at timestamptz null,

  opened_at timestamptz not null default now(),
  resolved_at timestamptz null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Estados permitidos:

```text
open
waiting_customer
action_required
scheduled
resolved
closed
```

No crear un enum excesivo.

---

# 6. TABLA `interaction_events`

```sql
create table interaction_events (
  id uuid primary key default gen_random_uuid(),

  thread_id uuid null references interaction_threads(id) on delete cascade,
  prospect_id uuid not null references prospects(id) on delete cascade,
  contact_id uuid null references contacts(id) on delete set null,

  activity_id uuid null,
  user_id uuid null references auth.users(id) on delete set null,

  channel text not null,
  event_type text not null,

  interaction_state text null,
  result text null,
  direction text null,

  effective_contact boolean not null default false,

  notes text null,

  provider text null,
  provider_event_id text null,

  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  metadata jsonb not null default '{}'::jsonb
);
```

`direction`:

```text
inbound
outbound
internal
```

---

# 7. ACTIVITIES EXISTENTES

No eliminar `activities`.

Durante transición:

```text
activities
= histórico / compatibilidad

interaction_events
= capa operativa nueva
```

Puede existir relación:

```text
interaction_events.activity_id
```

Las actividades nuevas pueden generar en una misma operación:

```text
activity
+
interaction_event
+
interaction_thread
```

---

# 8. REGLAS DE CREACIÓN DE THREAD

Una nueva actividad puede:

```text
A. crear thread
B. actualizar thread existente
C. no crear thread
```

Crear thread para:

- WhatsApp saliente/entrante;
- email saliente/entrante;
- llamada que requiere continuidad;
- visita con continuidad comercial;
- reunión con continuidad.

No crear thread para:

- nota interna simple;
- actividad cerrada sin próximo paso;
- registro informativo sin continuidad.

---

# 9. MATCHING DE THREAD EXISTENTE

Antes de crear uno nuevo, buscar thread no resuelto por:

```text
prospect_id
contact_id
channel
```

Regla V1:

si existe un thread activo del mismo contacto + canal, actualizarlo.

Permitir luego:

```text
Nueva conversación
```

cuando el usuario quiera separar temas.

---

# 10. CICLO DE ESTADO

## WhatsApp enviado

```text
event_type = message_sent
thread.status = waiting_customer
last_outbound_at = now()
```

## Cliente respondió

```text
event_type = message_received
thread.status = action_required
last_inbound_at = now()
```

## Usuario vuelve a responder

```text
event_type = message_sent
thread.status = waiting_customer
```

## Resolución

```text
thread.status = resolved
resolved_at = now()
```

## Reapertura

```text
thread.status = open / action_required
event_type = thread_reopened
```

---

# 11. SMART QUEUES

Implementarlas como queries/RPCs, no como tablas.

## `requires_action`

```text
status = action_required
```

## `waiting_customer`

```text
status = waiting_customer
```

## `no_response_24h`

```text
status = waiting_customer
AND now() - last_outbound_at > 24h
```

## `stale_48h`

```text
status IN ('waiting_customer','action_required')
AND now() - last_event_at > 48h
```

## `interested_without_next_action`

Resultado de interés explícito y sin tarea futura pendiente.

## `quote_pending`

`requested_quote` sin evento posterior de `quote_sent`, oportunidad ni resolución.

## `overdue_tasks`

Usar tabla `tasks`.

Los thresholds deben quedar configurables.

---

# 12. CONFIGURACIÓN DE SMART QUEUES

Crear:

```ts
SMART_QUEUE_CONFIG
```

Ejemplo:

```ts
{
  id: "no_response_24h",
  label: "Sin respuesta +24 h",
  priority: 40,
  icon: "Clock"
}
```

No distribuir reglas por múltiples componentes.

---

# 13. PANTALLA NUEVA — BANDEJA COMERCIAL

Ruta recomendada:

```text
/inbox
```

Nombre visible:

```text
Bandeja comercial
```

Subtítulo:

```text
Gestioná conversaciones, respuestas y próximos pasos
```

Filtros:

- Hoy;
- Esta semana;
- Todos;
- Usuario;
- Canal;
- Ciudad;
- Prioridad.

---

# 14. TABS PRINCIPALES

```text
Todo
Requieren acción
Esperando respuesta
Sin respuesta
Tareas
Oportunidades
```

Cada tab con contador.

---

# 15. RESUMEN SUPERIOR

Cards compactas:

```text
Requieren acción
Esperando respuesta
Sin respuesta +24h
Tareas hoy
Vencidas
```

No usar cards gigantes.

---

# 16. ACTIVIDAD DE HOY

Crear feed cronológico:

```text
12:15 WhatsApp enviado
11:42 Llamada sin respuesta
10:20 Visita realizada
```

El feed describe lo ocurrido.

Las queues muestran lo accionable.

No mezclar ambos conceptos.

---

# 17. CARD DE THREAD

Estructura compacta:

```text
[ canal ] Empresa
Contacto

Hace X min

Tema / motivo

Último evento
Estado actual

Acciones contextuales
```

Objetivo de altura cerrada: aprox. 80–140 px según contenido.

---

# 18. CARD WHATSAPP — ESPERANDO

```text
WHATSAPP
CESCA Hnos.

Juan Pablo Luque
Hoy · 12:15

Presentación comercial

Se envió brochure PRESOL.

Esperando respuesta

[ Respondió ]
[ Sin respuesta ]
[ Abrir WhatsApp ]
[ Llamar ]
[ ... ]
```

---

# 19. CARD WHATSAPP — RESPONDIÓ

```text
Respondió hace 12 min

"Mandame información del carretón"

[ Pidió información ]
[ Pidió cotización ]
[ Interesado ]
[ Sin interés ]
[ Abrir WhatsApp ]
```

---

# 20. CARD LLAMADA — NO ATENDIÓ

```text
LLAMADA
Astillero Fuentes

No atendió · hace 1 h

[ Volver a llamar ]
[ WhatsApp ]
[ Crear tarea ]
```

---

# 21. CARD VISITA

```text
VISITA
Metalúrgica XYZ

Habló con responsable
Pidió cotización

[ Crear cotización ]
[ Llamar ]
[ Crear oportunidad ]
```

---

# 22. ACCIONES CONTEXTUALES

Las acciones dependen de:

```text
channel
thread.status
latest_event
latest_result
```

No mostrar el mismo conjunto en todas las cards.

---

# 23. ACCIÓN “RESPONDIÓ”

Para WhatsApp manual, al tocar:

```text
Respondió
```

abrir mini modal:

```text
¿Qué pasó?

Pidió información
Pidió cotización
Interesado
Quiere llamada
Quiere reunión
Sin interés
Otro
```

Guardar evento inbound/manual y actualizar el thread a `action_required`.

---

# 24. ACCIÓN “SIN RESPUESTA”

Opciones:

```text
Seguir esperando
Crear seguimiento
Reintentar luego
Cerrar interacción
```

No cerrar automáticamente por falta de respuesta.

---

# 25. ABRIR WHATSAPP

Usar el teléfono del `contact_id` asociado al thread:

```text
https://wa.me/<numero_normalizado>
```

No enviar mensajes automáticamente en V1.

---

# 26. CONTACTO PRINCIPAL

La ficha de prospecto debe mantener selector de contacto.

Botones:

```text
Llamar
WhatsApp
Email
```

usan el contacto seleccionado.

Los threads ya existentes conservan el `contact_id` con el que fueron creados.

---

# 27. DETALLE DE THREAD

Al expandir:

```text
12:15 mensaje enviado
12:17 entregado           // futuro API
12:30 leído               // futuro API
13:06 respondió
13:10 pidió información
13:15 usuario envió ficha
```

Timeline inmutable.

---

# 28. TAREAS

Regla central:

**No crear tarea automáticamente** por:

- WhatsApp enviado;
- email enviado;
- llamada realizada.

Crear task solo cuando existe:

```text
acción concreta
+
fecha/hora
```

Agregar FK opcional:

```sql
alter table tasks
add column interaction_thread_id uuid null
references interaction_threads(id) on delete set null;
```

---

# 29. OPORTUNIDADES

Desde un thread permitir:

```text
Crear oportunidad
```

Prellenar:

```text
prospect
contact
owner
source_thread_id
```

Opcional:

```sql
alter table opportunities
add column source_thread_id uuid null
references interaction_threads(id) on delete set null;
```

---

# 30. NOTA DE VOZ — OBJETIVO

La voz debe convertirse en el método rápido de carga manual.

Flujo:

```text
usuario graba
→ audio
→ transcripción
→ IA estructura
→ usuario revisa
→ usuario confirma
→ activity + event + thread + optional task
```

---

# 31. UI DE NOTA DE VOZ

Después de grabar:

```text
Procesando...
```

Mostrar preview:

```text
Actividad sugerida:
Visita

Contacto:
Martín — Logística

Resultado:
Pidió información

Resumen:
Trasladan regularmente dos máquinas.

Próxima acción sugerida:
Enviar ficha del carretón

[ Editar ]
[ Confirmar ]
```

---

# 32. IA — PRINCIPIO

La IA puede:

- transcribir;
- resumir;
- clasificar;
- extraer;
- sugerir.

La IA NO debe sin confirmación:

- cambiar estado comercial;
- crear oportunidad;
- cerrar thread;
- marcar interesado;
- enviar mensajes.

---

# 33. AI PIPELINE

Entrada:

```text
texto manual
transcripción
notas
mensaje futuro WhatsApp
email futuro
```

Salida estructurada:

```json
{
  "summary": "",
  "channel": "",
  "interaction_state": "",
  "result": "",
  "effective_contact": false,
  "interest_signal": null,
  "contact_name": null,
  "contact_role": null,
  "next_action": null,
  "next_action_date": null,
  "confidence": 0.0
}
```

---

# 34. HUMAN-IN-THE-LOOP

Ejemplo:

```text
✨ Sugerencia IA
Pidió cotización

[ Confirmar ]
[ Cambiar ]
```

La propuesta no se convierte en verdad hasta confirmación.

---

# 35. AI PROVIDER ABSTRACTION

Crear adapter:

```ts
interface AIProvider {
  transcribeAudio(input: unknown): Promise<unknown>
  classifyInteraction(input: unknown): Promise<unknown>
  summarize(input: unknown): Promise<unknown>
  suggestNextAction(input: unknown): Promise<unknown>
}
```

No llamar proveedores directamente desde React.

---

# 36. CONTROL DE COSTOS

Implementar:

- prompts breves;
- structured output;
- límite bajo de tokens;
- cache por hash;
- no reprocesar misma nota;
- log de uso.

Tabla opcional:

```text
ai_usage_log
provider
model
input_tokens
output_tokens
estimated_cost
created_at
```

---

# 37. IA V1

Implementar primero:

1. transcripción;
2. resumen;
3. clasificación de resultado;
4. sugerencia de próxima acción.

No implementar todavía:

- agentes autónomos;
- respuestas automáticas;
- envío automático.

---

# 38. FORMULARIO DE ACTIVIDAD V3

Reutilizar la lógica ya definida:

```text
Canal
Estado de interacción
Resultado
Notas
Próxima acción
```

Fuente central:

```text
ACTIVITY_CHANNEL_CONFIG
```

No contradecir los documentos:

```text
PRESOL_CRM_REGISTRO_ACTIVIDAD_V3_ANTIGRAVITY.md
PRESOL_CRM_MATRIZ_ACTIVIDAD_POR_CANAL.md
```

---

# 39. WHATSAPP MANUAL — AHORA

Mientras no exista API oficial:

```text
usuario registra Mensaje enviado
→ activity
→ event
→ thread
→ status waiting_customer
```

Cuando recibe respuesta real:

```text
usuario toca Respondió
→ nuevo event
→ status action_required
```

---

# 40. WHATSAPP API — FUTURO

Preparar el modelo para:

```text
sent
delivered
read
failed
inbound message
```

Flujo:

```text
provider event
→ normalize
→ interaction_event
→ update thread
→ smart queue
```

La UI no debe depender de Meta.

---

# 41. EMAIL — FUTURO

Misma lógica:

```text
Email outbound
→ waiting_customer

Email inbound
→ action_required
```

Crear interfaz futura:

```ts
interface EmailProvider {
  sendEmail(...args: unknown[]): Promise<unknown>
  parseInbound(...args: unknown[]): Promise<unknown>
  normalizeMessage(...args: unknown[]): Promise<unknown>
}
```

---

# 42. EVENT TYPES

Usar códigos neutros:

```text
message_sent
message_received
message_read
message_delivered
message_failed

call_attempted
call_connected
call_no_answer

visit_completed
meeting_completed

note_added

result_classified
task_created
opportunity_created

thread_resolved
thread_reopened
```

---

# 43. PROVIDER IDS Y DEDUPLICACIÓN

Preparar:

```text
provider
provider_event_id
```

Índice:

```sql
create unique index interaction_events_provider_unique
on interaction_events(provider, provider_event_id)
where provider_event_id is not null;
```

---

# 44. RLS

Todas las tablas nuevas deben tener RLS consistente con el CRM.

No crear tablas nuevas sin seguridad.

Acceso solo a threads/events de prospectos autorizados.

---

# 45. REALTIME

Suscribirse a:

```text
interaction_threads
interaction_events
tasks
```

para refrescar:

- Inbox;
- Prospect page;
- Dashboard.

---

# 46. RPC `get_commercial_inbox`

Debe devolver un payload único:

```json
{
  "counts": {
    "requires_action": 0,
    "waiting_customer": 0,
    "no_response_24h": 0,
    "tasks_today": 0,
    "overdue_tasks": 0
  },
  "threads": []
}
```

Evitar N+1.

---

# 47. RPC `get_thread_detail`

Retornar:

```text
thread
prospect
contact
events
pending_tasks
opportunity
```

---

# 48. RPC `register_activity_v3`

Responsabilidades:

```text
validar channel / interaction / result
crear activity
crear event
crear o actualizar thread
calcular effective_contact
opcional crear task
retornar overview actualizado
```

La operación debe ser atómica.

---

# 49. UI DESKTOP

Layout sugerido:

```text
Header

[Requieren acción]
[Esperando]
[Sin respuesta]
[Tareas]
[Vencidas]

Tabs

Feed / Threads

Right rail opcional:
Tareas de hoy
```

No saturar.

---

# 50. UI MOBILE

Mobile-first:

```text
Header compacto
cards resumen horizontales
tabs sticky
thread cards
sticky CTA + Registrar actividad
```

Botones táctiles >= 40 px.

---

# 51. FEED VS QUEUES

Feed:

```text
Qué ocurrió, ordenado por tiempo
```

Queues:

```text
Qué necesita atención
```

No son lo mismo.

---

# 52. DASHBOARD

Agregar métricas operativas:

- interacciones abiertas;
- requieren acción;
- esperando respuesta;
- sin respuesta +24 h;
- interesados sin próxima acción;
- cotizaciones pendientes.

Complementan, no reemplazan:

- visitados;
- contactos efectivos;
- interesados;
- oportunidades.

---

# 53. MÉTRICAS FUTURAS

Preparar sin implementar todas:

- tiempo medio de primera respuesta;
- edad promedio del thread;
- threads abiertos/resueltos;
- % resueltos;
- no response >24 h.

---

# 54. V1 — SCOPE OBLIGATORIO

Implementar ya:

```text
interaction_threads
interaction_events
integración con actividad manual
smart queues
commercial inbox
thread cards
acciones contextuales
task linking
voice note → AI suggestion
AI classify / summarize / suggest
prospect integration
dashboard counts básicos
realtime
```

---

# 55. FUERA DE SCOPE V1

No implementar ahora:

```text
WhatsApp Business API
Gmail API
Microsoft Graph
VoIP
auto-send
AI autonomous replies
workflow builder
SLA engine
```

Solo dejar adapters/interfaces preparados.

---

# 56. MIGRACIÓN HISTÓRICA

No reconstruir threads perfectos del pasado.

Recomendación:

```text
crear threads desde deployment en adelante
```

Mantener actividades viejas en timeline histórica.

Backfill reciente solo si el mapping es inequívoco.

---

# 57. COMPATIBILIDAD Y DEDUPLICACIÓN VISUAL

Si un `interaction_event` referencia `activity_id`, no renderizar ambos como dos eventos diferentes en la misma timeline.

---

# 58. REOPEN

Permitir:

```text
Reabrir interacción
```

Crear evento:

```text
thread_reopened
```

---

# 59. AUDIT LOG

Registrar:

- creación thread;
- cambio estado;
- clasificación manual;
- IA aceptada/rechazada;
- resolución;
- reapertura.

---

# 60. FALLBACK DE IA

Si IA falla:

```text
guardar actividad normalmente
```

La IA nunca debe bloquear la operación principal.

---

# 61. AUDIO

Si se conserva:

```text
Supabase Storage
voice-notes/{prospect_id}/{uuid}.webm
```

Preferencia:

```text
delete_after_transcription = true
```

salvo que haya razón de negocio para guardar audio.

---

# 62. DETECCIÓN DE CONTACTO DESDE VOZ

IA puede sugerir:

```text
contact_name
contact_role
```

Si no hay match exacto:

```text
¿Crear nuevo contacto?
```

No crearlo automáticamente.

---

# 63. THREAD SUBJECT

Puede originarse en:

- motivo manual;
- resumen IA;
- tipo de evento.

Ejemplos:

```text
Presentación comercial
Consulta por carretón
Cotización transporte
Seguimiento visita
```

Debe ser editable.

---

# 64. PRIORIDAD

V1 opcional:

```text
low
normal
high
```

No implementar scoring complejo.

---

# 65. ORDEN DE BANDEJA

Orden recomendado:

```text
1. action_required
2. vencidos / stale
3. waiting_customer
4. scheduled
```

Dentro de cada grupo:

```text
last_event_at desc
```

---

# 66. SEARCH Y FILTROS

Buscar por:

- empresa;
- contacto;
- subject;
- notes.

Filtrar por:

- canal;
- estado;
- usuario;
- fecha;
- ciudad;
- prioridad.

---

# 67. COMPONENTES SUGERIDOS

```text
CommercialInboxPage
InboxSummaryCards
InboxTabs
ThreadCard
ThreadTimeline
ThreadQuickActions
ActivityTodayFeed
SmartQueueList

ActivityModalV3
VoiceActivityCapture
AISuggestionReview

ProspectOpenInteractions
ProspectRecentActivity
ProspectTasks
```

---

# 68. SERVICES

```text
interaction-service.ts
activity-service.ts
smart-queue-service.ts
ai-service.ts
voice-service.ts
```

---

# 69. SERVER ACTIONS

```text
registerActivityV3
createThread
appendThreadEvent
updateThreadStatus
resolveThread
reopenThread
createTaskFromThread
createOpportunityFromThread
processVoiceActivity
acceptAISuggestion
```

---

# 70. TIPOS COMPARTIDOS

```text
InteractionThread
InteractionEvent
ThreadStatus
EventType
SmartQueue
AIInteractionSuggestion
```

---

# 71. TESTS UNITARIOS OBLIGATORIOS

```text
WhatsApp sent -> waiting_customer
WhatsApp response -> action_required
Resolve -> resolved
Reopen -> open/action_required
No response +24h -> smart queue
Activity -> event
Task no auto-creada salvo pedido explícito
AI failure no bloquea activity
```

---

# 72. TESTS E2E

## Caso A
Registrar WhatsApp enviado:

```text
→ aparece en Actividad de hoy
→ aparece en Esperando respuesta
```

## Caso B
Marcar Respondió:

```text
→ sale de Esperando respuesta
→ entra en Requieren acción
```

## Caso C
Resultado `requested_info`:

```text
→ sugerir Enviar información
```

## Caso D
Crear tarea mañana:

```text
→ aparece en tareas
→ thread mantiene estado
```

## Caso E
Resolver:

```text
→ desaparece de queues activas
→ permanece en timeline
```

---

# 73. TEST DE VOZ

Input:

```text
"Hablé con Martín de logística,
me pidió ficha del carretón
y que lo llame el jueves."
```

Esperado:

```text
effective_contact = true
result = requested_info
contact_name = Martín
next_action = call
```

El usuario debe confirmar antes de persistir clasificación/acción.

---

# 74. PERFORMANCE

Evitar:

```text
N+1 prospect
N+1 contact
N+1 tasks
```

Usar payload agregado para inbox.

Índices:

```sql
create index interaction_threads_status_idx
on interaction_threads(status);

create index interaction_threads_prospect_idx
on interaction_threads(prospect_id);

create index interaction_threads_owner_idx
on interaction_threads(owner_id);

create index interaction_threads_last_event_idx
on interaction_threads(last_event_at desc);

create index interaction_events_thread_idx
on interaction_events(thread_id, occurred_at desc);
```

---

# 75. OBSERVABILITY

Loguear:

- register activity errors;
- thread transition errors;
- AI errors;
- voice errors;
- RPC latency.

---

# 76. FEATURE FLAG

Activar inicialmente bajo:

```text
commercial_inbox_v1
```

Rollout:

```text
A. developer/admin
B. un usuario real
C. equipo completo
```

---

# 77. FASES DE IMPLEMENTACIÓN

## Fase 1 — Foundation

```text
schema
RLS
types
services
thread lifecycle
events
indexes
```

## Fase 2 — Manual Flow

```text
ActivityModalV3
thread creation/update
smart queues
```

## Fase 3 — Inbox

```text
/inbox
summary
tabs
cards
actions
thread detail
```

## Fase 4 — Voice + AI

```text
record
transcribe
classify
suggest
review
confirm
```

## Fase 5 — Prospect Integration

```text
Actividad reciente
Interacciones abiertas
Tareas / próxima acción
selector contacto
quick actions
```

## Fase 6 — Dashboard

```text
requires action
waiting
no response
```

## Fase 7 — Hardening

```text
tests
RLS
performance
mobile
realtime
error states
empty states
```

---

# 78. UI VALIDATION

Entregar capturas:

Desktop:

```text
1440x900
1440x1080
```

Mobile:

```text
390x844
```

Pantallas:

- Inbox;
- thread expandido;
- ActivityModal WhatsApp;
- Voice AI Review;
- Prospect page.

---

# 79. EMPTY STATES

Ejemplo:

```text
No hay conversaciones esperando respuesta.
```

CTA:

```text
Registrar actividad
```

---

# 80. DISEÑO

Mantener el lenguaje visual actual de PRESOL CRM:

- cards limpias;
- bordes sutiles;
- jerarquía fuerte;
- poco ruido;
- acciones principales claras.

No convertir la app en un “chat app”. Debe seguir pareciendo CRM profesional.

---

# 81. FUTURE ADAPTER — WHATSAPP

Definir interfaz:

```ts
interface MessagingProvider {
  sendMessage(...args: unknown[]): Promise<unknown>
  parseWebhook(...args: unknown[]): Promise<unknown>
  normalizeStatus(...args: unknown[]): Promise<unknown>
}
```

No implementar todavía.

---

# 82. FUTURE ADAPTER — EMAIL

```ts
interface EmailProvider {
  sendEmail(...args: unknown[]): Promise<unknown>
  parseInbound(...args: unknown[]): Promise<unknown>
  normalizeMessage(...args: unknown[]): Promise<unknown>
}
```

---

# 83. NORMALIZED MESSAGE

Formato futuro común:

```json
{
  "provider": "",
  "provider_event_id": "",
  "channel": "",
  "direction": "",
  "from": "",
  "to": "",
  "body": "",
  "occurred_at": "",
  "delivery_status": ""
}
```

---

# 84. INGESTION PIPELINE FUTURO

```text
Webhook
→ validate
→ deduplicate
→ normalize
→ identify contact
→ identify/create thread
→ create event
→ update smart queue
```

Matching futuro:

```text
WhatsApp → phone normalized
Email → email normalized
```

Si no hay match, preparar concepto de:

```text
Mensajes sin identificar
```

sin implementarlo aún.

---

# 85. RELACIÓN CON CRM CORE

Evitar hardcodear PRESOL en el dominio.

Preferir nombres neutros:

```text
interaction_thread
interaction_event
smart_queue
```

Los labels pueden seguir siendo PRESOL.

---

# 86. CRITERIOS DE ACEPTACIÓN V1

- [ ] Registrar WhatsApp crea evento y thread.
- [ ] Thread aparece en Esperando respuesta.
- [ ] Se puede marcar Respondió.
- [ ] Pasa a Requieren acción.
- [ ] Se puede clasificar resultado.
- [ ] Se puede crear tarea.
- [ ] Task no se crea automáticamente.
- [ ] Se puede resolver thread.
- [ ] Timeline conserva todos los eventos.
- [ ] Feed del día muestra actividad.
- [ ] Smart queues funcionan.
- [ ] Prospect page muestra interacciones abiertas.
- [ ] Voice note funciona.
- [ ] IA devuelve sugerencia estructurada.
- [ ] Usuario confirma sugerencias IA.
- [ ] Fallo IA no bloquea.
- [ ] Mobile usable.
- [ ] RLS verificada.
- [ ] No hay N+1 relevante.

---

# 87. DEFINITION OF DONE

El usuario debe poder:

```text
1. registrar un WhatsApp enviado
2. verlo en Actividad de hoy
3. verlo como interacción esperando respuesta
4. marcar que respondió
5. clasificar el resultado
6. crear próxima acción si corresponde
7. resolver la interacción
8. revisar el historial completo
```

y hacer el mismo flujo mediante nota de voz asistida por IA.

---

# 88. ENTREGABLES PREVIOS DE ANTIGRAVITY

Antes de modificar código, entregar:

```text
1. current_schema_audit.md
2. activity_flow_audit.md
3. migration_plan.md
4. files_to_modify.md
5. risk_assessment.md
```

Después implementar por fases.

No hacer refactor masivo no relacionado.

No romper:

```text
dashboard existente
prospect detail
tasks
opportunities
activities
realtime
```

---

# 89. PRINCIPIO FINAL DE PRODUCTO

La nueva experiencia debe orientarse a:

```text
¿Qué necesita mi atención ahora?
```

y no solamente:

```text
¿Qué cargué en el CRM?
```

Arquitectura objetivo:

```text
CAPTURA
manual / voz / APIs futuras
          ↓
EVENTOS
inmutables
          ↓
THREADS
conversaciones vivas
          ↓
SMART QUEUES
qué necesita atención
          ↓
TASKS
qué hacer y cuándo
          ↓
OPPORTUNITIES
qué negocio cerrar
          ↓
IA
resumir / clasificar / sugerir
```

Este modelo permite empezar **ya** con captura manual + voz + IA y conectar posteriormente WhatsApp/email sin rehacer el CRM.
