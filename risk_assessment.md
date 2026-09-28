# PRESOL CRM — Risk Assessment & Mitigation
**Documento previo de arquitectura — Entregable 5 de 5**  
**Fecha:** 28 de Septiembre de 2026  
**Referencia:** `activity_upgrade_implementation.md` (Sección 88)

---

## 1. Matriz de Riesgos y Mitigación

| ID | Riesgo Identificado | Severidad | Probabilidad | Estrategia de Mitigación |
|---|---|---|---|---|
| **R1** | **Regresión en el guardado de actividades (`createActivity`)** | Alta | Baja | La persistencia en `public.activities` se mantiene como operación primaria. La orquestación de `interaction_threads` e `interaction_events` se ejecuta de forma coordinada con manejo de excepciones: si ocurre un error inesperado en la capa de threads, la actividad no se pierde y el estado comercial del prospecto se actualiza correctamente. |
| **R2** | **Degradación de rendimiento / consultas N+1 en la Bandeja (`/inbox`)** | Media | Media | Se diseñan consultas de agregación en `src/lib/interactions/queries.ts` que traen en un único viaje los threads junto con sus prospectos, contactos y contadores de queues. Se agregan índices compuestos específicos en Postgres para `(status, last_event_at desc)` y `(prospect_id, status)`. |
| **R3** | **Alucinaciones o acciones automáticas no deseadas de IA** | Alta | Baja | Cumplimiento estricto del principio Human-in-the-loop (Secciones 32 y 34 de la especificación). La IA únicamente sugiere (resumen, clasificación de canal y resultado, próxima acción). Ninguna sugerencia modifica la base de datos hasta que el vendedor la inspecciona y confirma en el modal interactivo de revisión. |
| **R4** | **Confusión conceptual entre Tareas (`tasks`) e Hilos (`threads`)** | Media | Media | Separación clara en diseño y lógica: el hilo de interacción refleja el estado de la conversación (ej: "Esperando respuesta"), mientras que la tarea es un compromiso concreto con fecha y hora. Enviar un WhatsApp o esperar respuesta no crea una tarea automática. |
| **R5** | **Duplicación visual en la timeline histórica** | Baja | Media | Deduplicación controlada: cuando un evento de interacción referencia a un `activity_id`, el timeline renderiza la vista enriquecida sin duplicar la entrada. |
| **R6** | **Fallo o latencia de APIs externas (Whisper / OpenAI)** | Media | Media | Fallback transparente: si la transcripción o extracción estructurada falla, el sistema notifica amigablemente al usuario y permite completar o corregir los campos manualmente sin bloquear la operatoria. |
| **R7** | **Inconsistencia de permisos / RLS** | Media | Baja | Las nuevas tablas `interaction_threads` e `interaction_events` aplican Row Level Security consistente con las políticas existentes del CRM basadas en `profiles.role`. |

---

## 2. Criterios de Aceptación para Despliegue Seguro
1. `npm test`: 100% de tests unitarios aprobados (incluyendo la nueva suite de threads y queues).
2. `npm run build`: compilación limpia sin errores de tipos TypeScript ni advertencias de empaquetado.
3. Compatibilidad hacia atrás: verificación de que el dashboard existente, la ficha de prospecto, la lista de tareas y las giras funcionan sin alteraciones.
