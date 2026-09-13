# PRESOL CRM — LÓGICA Y ESTRUCTURA FICHA PROSPECTO V2

Este documento detalla la estructura lógica, el flujo de datos y las posibles acciones de usuario (interacciones) en cada uno de los componentes modulares de la nueva **Ficha de Prospecto V2** (`/prospects/[id]`).

La arquitectura general está basada en un componente contenedor `page.tsx` que recupera toda la data de una sola vez mediante un RPC (`get_prospect_overview`) o con un _fallback_ si el RPC no existe, y provee esta información ya estructurada hacia las "cards" (Single Source of Truth). Adicionalmente, cuenta con un `RealtimeListener` para actualizaciones en vivo.

---

## 1. Cabecera Principal (`ProspectHeader.tsx`)

**Propósito:** Proveer identificación instantánea, cambio rápido de estado y accesos directos de comunicación.

- **Datos que consume:**
  - `company_name`, `city`, `commercial_category`.
  - Identificadores y segmentación: `external_id`, `class` (Clase A, B, C).
  - Estado comercial en vivo: `contact_status`.
- **Lógica de presentación:**
  - Los badges se muestran u ocultan según si la información existe.
- **Acciones Disponibles:**
  - **Selector de Estado:** Selector dropdown directo que dispara un Server Action (`updateProspectStatus`) al seleccionarlo, con UI optimista.
  - **Llamar:** (Si hay teléfono) Lanza un enlace `tel:`.
  - **WhatsApp:** (Si hay teléfono) Abre `whatsapp://send` limpiando el teléfono de caracteres que no sean dígitos.
  - **Maps:** Abre Google Maps buscando url guardada, o concatenando Nombre + Ciudad.
  - **Registrar Gestión (CTA Principal):** Abre el modal de nueva actividad (Visita/Llamada).
  - **Menú Contextual `...` (Acciones secundarias):**
    - Crear Tarea.
    - Crear Oportunidad.
    - Editar Prospecto (Abre modal de edición global).
    - Eliminar Prospecto (Abre modal destructivo).

---

## 2. Próxima Acción (`NextActionCard.tsx`)

**Propósito:** Focalizar al usuario exclusivamente en lo que tiene que hacer a continuación (urgencia).

- **Datos que consume:** La **primera tarea** de la lista (filtrada previamente con `status = 'pending'`, ordenada por `due_at` ascendente).
- **Lógica de presentación (Fechas):**
  - **HOY (Naranja):** Si el due_date cae en el día en curso.
  - **VENCIDA (Rojo):** Si el due_date ya pasó respecto a `new Date()`.
  - **EN X DÍAS (Azul):** Si es en el futuro, mostrando el cálculo matemático.
  - **Empty State:** Si el array está vacío, muestra un formato hiper-compacto (< 150px).
- **Acciones Disponibles:**
  - **Completar Tarea:** Botón CTA principal que marca la tarea como hecha (optimista).
  - **+ Crear seguimiento:** Disponible desde el Empty State si no hay tarea próxima.

---

## 3. Contacto Principal (`PrimaryContactCard.tsx`)

**Propósito:** Tener siempre a mano con quién hablar (Decision Maker).

- **Datos que consume:** Array de contactos, donde filtra por `is_primary = true` (o devuelve el array[0] si ninguno lo es explícitamente). Si no hay array, consume los teléfonos/mails genéricos de empresa (`prospect.primary_phone`).
- **Lógica de presentación:**
  - Si un número existe, revela automáticamente el atajo de WhatsApp al hacer hover (invisible por defecto).
- **Acciones Disponibles:**
  - **Editar:** Editar los detalles de este contacto.
  - **+ Agregar Contacto:** Disponible desde el Empty State.
  - **Ver X contactos más:** Enlace inferior si existen más contactos secundarios (el recuento se calcula en el servidor).

---

## 4. Estado Comercial (`CommercialStatusCard.tsx`)

**Propósito:** Vista de alto nivel de las variables de conversión y negocio del prospecto.

- **Datos que consume:**
  - `contact_status`: Con mapeo de color visual (Pendiente, En Gestión, Cotización, etc.).
  - `visit_priority`: Etiqueta "Alta", "Media" o "Baja".
  - `source_name`: Canal por donde ingresó (origen).
  - `created_at`: Formateado en 'dd MMM yyyy'.
  - `activity_at`: Extraído de la última actividad registrada para saber el timestamp del último contacto.
- **Lógica de presentación:**
  - Estructura Grid de `90px` para las _labels_ y `1fr` para el valor.
- **Acciones Disponibles:** Puramente informativo en esta vista.

---

## 5. Última Interacción (`LastInteractionCard.tsx`)

**Propósito:** Proveer un recordatorio instantáneo del resultado del último punto de contacto y notas tomadas.

- **Datos que consume:** La **actividad [0]** del listado (la más reciente por `activity_at` descendente). 
- **Lógica de presentación:**
  - Badge para identificar si fue Llamada, Visita, Email.
  - Inicial del nombre del usuario que lo registró (`charAt(0)`) junto a la hora y fecha.
  - Empty state compacto.
- **Acciones Disponibles:**
  - **Menú Contextual `...`:**
    - Editar (Abre modal con `activityToEdit`).
    - Eliminar (Abre Modal destructivo con validación Server Action).
  - **Registrar primera gestión:** Disponible en el Empty State.

---

## 6. Resumen Comercial (`CommercialSummaryCard.tsx`)

**Propósito:** Recordar la tesis de ventas sin tener que navegar por múltiples campos.

- **Datos que consume:**
  - `probable_need` (Necesidad Probable).
  - `sales_hook` (Enfoque Comercial).
  - `presol_offer` (Servicios a ofrecer).
- **Lógica de presentación:**
  - Layout en 3 columnas unificadas con separadores divisorios `divide-x`.
  - Iconos contextuales para cada campo.
  - Si los textos están en blanco, muestra "Sin definir" en gris itálico.
- **Acciones Disponibles:**
  - **Editar:** Abre la edición de estos campos específicos.

---

## 7. Actividad Reciente (`ActivityTimeline.tsx`)

**Propósito:** Historial de lo ocurrido (CRM timeline clásico).

- **Datos que consume:** Array de actividades recientes.
- **Lógica de presentación:**
  - Se extrae el primer lote (limitado visualmente a `slice(0, 5)`) para no desbalancear verticalmente la vista si el historial es muy largo.
  - Línea vertical izquierda (Timeline) usando pseudoelementos `before:` y gradientes para desvanecerse hacia abajo.
  - Map de Íconos y colores automáticos según `type` (Llamadas = Rojo, Visitas = Violeta).
- **Acciones Disponibles:**
  - **Filtro Select:** (Ej: Visitas, Llamadas, WhatsApp). _Visual_.
  - **Ver Todas:** Link inferior para ir (o expandir) al historial completo cuando es `> 5`.
  - **+ Registrar primera gestión:** Desde el empty state.

---

## 8. Seguimientos Abiertos (`OpenFollowupsCard.tsx`)

**Propósito:** Listado global de todas las tareas pendientes agendadas.

- **Datos que consume:** Array de `tasks` en estado `pending`.
- **Lógica de presentación:**
  - Limitado a `slice(0, 3)` para densificar la vista.
  - Diseño supercompacto con truncate para textos largos.
- **Acciones Disponibles:**
  - **Checkbox (Cuadrado):** Icono al lado de cada tarea; al cliquear ejecuta Server Action `completeTask` con optimismo en cliente (lo borra visualmente al instante de la lista).
  - **+ Nuevo:** Atajo superior.
  - **Ver todos los seguimientos:** Habilitado si el count es `> 3`.
  - **+ Crear seguimiento:** Desde Empty state.

---

## 9. Información Empresa & Data Quality (`CompanyInfoCard.tsx`)

**Propósito:** Datos tributarios y logísticos + Motor de completitud de datos (Gamificación).

- **Datos que consume:** 
  - Propiedades físicas/fiscales (Dirección, CUIT, Empleados, etc).
  - Componente integrado `DataQuality` que recibe el `{ score, status, missing }`.
- **Lógica de presentación:**
  - **Data Quality Logic:**
    - Evalúa en backend si campos como _teléfono, website, email, contacto_ están presentes.
    - Si `Score >= 95` = Verificado (Verde).
    - Si `Score >= 80` = Enriquecido (Azul).
    - Si `Score >= 40` = Parcial (Naranja).
    - En caso contrario = Incompleto (Gris/Rojo).
  - Barra de progreso que se anima al % correcto.
- **Acciones Disponibles:**
  - **Editar:** Editar los datos de empresa.
  - **Completar datos faltantes:** Sugiere al usuario mediante check-list lo que le falta rellenar en Data Quality.

---

## 10. Notas Internas (Acordeón) (`InternalNotesAccordion.tsx`)

**Propósito:** Foro / muro de discusión interna desvinculada de eventos comerciales.

- **Datos que consume:** Array de `comments`.
- **Lógica de presentación:**
  - Acordeón compacto (42-46px cerrado) que al desplegarse muestra las notas con color de fondo diferencial (Ej: Amarillo block-note `bg-yellow-50`).
- **Acciones Disponibles:**
  - **+ Agregar nota:** Para escribir comentarios directos sobre la ficha de uso interno.

---

## 11. Oportunidades Vinculadas (Acordeón) (`LinkedOpportunitiesAccordion.tsx`)

**Propósito:** Visualizar flujos económicos vinculados a esta cuenta.

- **Datos que consume:** Array de `opportunities`.
- **Lógica de presentación:**
  - Acordeón compacto.
  - Muestra monto de valor estimado formateado automáticamente por `Intl.NumberFormat('es-AR')` en Pesos Argentinos (ARS).
  - Subtitulo de "Próximo Paso".
- **Acciones Disponibles:**
  - **+ Crear Oportunidad:** Atajo para vincular directamente un _deal_ o negocio a este prospecto.
