# PRESOL CRM — Activity Flow Audit
**Documento previo de arquitectura — Entregable 2 de 5**  
**Fecha:** 28 de Septiembre de 2026  
**Referencia:** `activity_upgrade_implementation.md` (Sección 88)

---

## 1. Puntos de Entrada Actuales de Registro de Actividad

Actualmente existen 4 vías en el sistema mediante las cuales se ingresan actividades:

1. **Formulario Adaptativo V3 (`ActivityForm` en `src/components/crm/activity-form.tsx`):**
   - Modal desplegado desde la ficha del prospecto o la lista de actividades.
   - Selección de Canal (`visit`, `call`, `whatsapp`, `email`, `virtual_meeting`, `internal_note`).
   - Estado de interacción dinámico según canal.
   - Resultado comercial adaptativo según canal y estado.
   - Toggle opcional "Programar próxima acción" (tipo de acción sugerida, fecha, hora, responsable).
   - Invocación de `createActivity(formData)` en `src/app/actions/activities.ts`.

2. **Registro por Nota de Voz (`VoiceNoteModal` en `src/components/crm/voice-note-modal.tsx`):**
   - Graba audio WebM en el navegador.
   - Envía a `POST /api/voice` (Whisper para transcripción + GPT-4o-mini para extracción).
   - Invocaba `saveVoiceInteraction(prospectId, data)` en `src/app/actions/voice.ts`.
   - *Punto de mejora detectado:* Guardaba en la estructura legacy y no en la matriz adaptativa V3, y carecía de un modal de revisión detallado con confirmación manual de las sugerencias de la IA.

3. **Smart Check-In de Giras (`SmartCheckIn.tsx` / `TripStopCard`):**
   - Registra visitas presenciales rápidas asociadas a paradas de gira (`trip_stop_id`, `trip_id`).
   - Llama a `createActivity` precompletando canal `visit` y referencias de la parada.

4. **Botones Rápidos de la Ficha (`prospect-header.tsx`):**
   - Clic en teléfono (`tel:`) o enlace de WhatsApp (`whatsapp://send` o `wa.me`).
   - Actualmente abre la aplicación externa del vendedor en el dispositivo, pero no dejaba un hilo abierto en una bandeja unificada de trabajo.

---

## 2. Flujo de Ejecución en `createActivity` (`src/app/actions/activities.ts`)

Cuando se ejecuta `createActivity`:
1. Se autentica al usuario mediante cookies (`authClient.auth.getUser()`).
2. Se normaliza el canal (`normalizeChannel`).
3. Se calcula el booleano `effective_contact` con `isEffectiveContact(channel, interaction_state, result)`.
4. Se arma el payload dual:
   - Columnas V3: `channel`, `interaction_state`, `result`, `effective_contact`.
   - Columnas Legacy: `type`, `summary`, `outcome`.
5. Se inserta en la tabla `activities`.
6. Si el usuario activó `create_next_action`, se calcula la fecha de vencimiento (`due_at`) con zona horaria de Córdoba y se inserta un registro en la tabla `tasks`.
7. Se evalúa el impacto comercial mediante `calculateNewStatus(...)` y se actualiza el `contact_status` del prospecto (respetando la regla de nunca degradar estado comercial).
8. Se ejecutan las revalidaciones de ruta (`revalidatePath`).

---

## 3. Integración con el Nuevo Modelo de Threads y Eventos

Para no romper el CRM existente y garantizar una migración fluida, el flujo de actividad se ampliará de la siguiente manera:

```text
createActivity (formData)
       │
       ├── 1. Inserta en public.activities (compatibilidad y timeline histórico)
       │
       ├── 2. Busca thread activo (prospect_id + contact_id + channel)
       │      └── Si existe y no está resuelto: lo asocia
       │      └── Si no existe: crea nuevo interaction_thread
       │
       ├── 3. Determina el nuevo estado del thread:
       │      • WhatsApp/Email saliente → waiting_customer
       │      • Cliente respondió → action_required
       │      • Resultado concluyente sin seguimiento → resolved
       │
       ├── 4. Inserta public.interaction_events:
       │      • thread_id
       │      • activity_id (vinculado a la actividad recién creada)
       │      • channel, event_type, interaction_state, result, direction
       │      • effective_contact, notes, occurred_at
       │
       ├── 5. Si create_next_action está activo:
       │      • Crea la tarea en public.tasks
       │      • Asocia tasks.interaction_thread_id = thread_id
       │
       └── 6. Actualiza contact_status del prospecto si corresponde
```

### Reglas de Decisión por Canal:
- **WhatsApp / Email:**
  - Envío saliente (`message_sent`) → Thread pasa a `waiting_customer` y actualiza `last_outbound_at`.
  - Si el vendedor registra que el cliente respondió → Thread pasa a `action_required` y actualiza `last_inbound_at`.
- **Llamada:**
  - Sin contacto (`no_answer`) → Evento registrado; thread se mantiene abierto o se agenda reintento.
  - Contacto con continuidad → Thread activo.
- **Visita / Reunión:**
  - Si genera interés o solicitud de cotización/ficha → Thread activo con estado `scheduled` o `action_required`.
- **Nota Interna:**
  - Se registra el evento en el histórico del prospecto, pero **NO** genera un thread comercial activo para no contaminar la bandeja de trabajo.

---

## 4. Conclusión del Activity Flow Audit
El flujo de V3 implementado anteriormente es sólido y sirve como la base perfecta. La integración de threads y eventos se añadirá como una orquestación en el servicio sin modificar la interfaz de usuario del formulario existente, agregando a su vez la nueva pantalla `/inbox` para operar estos threads.
