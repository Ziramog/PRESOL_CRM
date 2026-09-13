# PRESOL CRM — FICHA DE PROSPECTO V2
## Especificación para Antigravity

**Objetivo:** rediseñar la ficha individual de prospecto para alcanzar el nivel visual y operativo del mockup aprobado, manteniendo la lógica comercial propia de PRESOL.

La ficha debe funcionar como centro operativo de la relación comercial, no como una pantalla plana de base de datos.

---

# 1. PREGUNTAS QUE DEBE RESPONDER LA FICHA

Al abrir un prospecto, el comercial debe entender en menos de 10 segundos:

- ¿Quién es esta empresa?
- ¿Cuál es su estado comercial?
- ¿Con quién tengo que hablar?
- ¿Qué pasó en la última interacción?
- ¿Qué tengo que hacer ahora?
- ¿Qué oportunidades existen?
- ¿Qué tan completos están los datos?

---

# 2. LAYOUT DESKTOP

Estructura recomendada:

```text
HEADER / IDENTIDAD / ACCIONES

┌──────────────────┬─────────────────┬─────────────────┐
│ PRÓXIMA ACCIÓN   │ CONTACTO        │ ESTADO COMERCIAL│
└──────────────────┴─────────────────┴─────────────────┘

┌──────────────────────────┬────────────────────────────┐
│ ÚLTIMA INTERACCIÓN       │ RESUMEN COMERCIAL          │
└──────────────────────────┴────────────────────────────┘

┌──────────────────────────┬────────────────┬────────────┐
│ ACTIVIDAD RECIENTE       │ SEGUIMIENTOS   │ EMPRESA    │
└──────────────────────────┴────────────────┴────────────┘

NOTAS INTERNAS
OPORTUNIDADES VINCULADAS
```

---

# 3. HEADER

Mostrar:

```text
Nombre de empresa
Tipo: Prospecto comercial
Ciudad, Provincia
Categoría / Rubro
Cantidad empleados si existe
Estado comercial
Prioridad
```

Ejemplo:

```text
Establecimientos Metalúrgicos Oncativo S.A.
Prospecto comercial

Oncativo, Córdoba
Industria metalúrgica

[ EN GESTIÓN ]
[ ALTA PRIORIDAD ]
```

No mostrar datos inventados. Si no existe cantidad de empleados, CUIT o LinkedIn, ocultar o mostrar “—”.

---

# 4. ACCIONES RÁPIDAS

En header:

```text
[ LLAMAR ]
[ WHATSAPP ]
[ MAPS ]
[ + REGISTRAR GESTIÓN ]
[ ... ]
```

## Registrar gestión

Abrir modal/drawer con:

```text
Tipo de actividad
Resultado
Notas
Fecha/hora
Próximo paso opcional
```

## Menú adicional

```text
Editar prospecto
Crear oportunidad
Crear tarea
Archivar
Marcar descartado
Eliminar (solo admin)
```

---

# 5. BLOQUE — PRÓXIMA ACCIÓN

Debe tener prioridad visual máxima.

Mostrar:

```text
Fecha
Hora
Descripción
Notas
Responsable
Estado
```

Ejemplo:

```text
PRÓXIMA ACCIÓN

Martes 16 septiembre
16:00

Llamar para coordinar visita en planta

Confirmar disponibilidad con Ariel Mattos
y proponer fecha para relevamiento.

Asignada a:
Juan Pérez

[ MARCAR COMO REALIZADA ]
```

Lógica:

```text
status != completed
ORDER BY due_at ASC
LIMIT 1
```

Estados visuales:

```text
VENCIDA
HOY
EN 3 DÍAS
```

Si no existe:

```text
Sin próxima acción definida.
[ + CREAR SEGUIMIENTO ]
```

---

# 6. BLOQUE — CONTACTO PRINCIPAL

Mostrar:

```text
Nombre
Cargo
Teléfono
Email
LinkedIn si existe
```

Acciones:

```text
Llamar
WhatsApp
Email
Editar
```

Contactos secundarios:

```text
Ver N contactos más
```

No mostrar todos por default.

---

# 7. BLOQUE — ESTADO COMERCIAL

Mostrar:

```text
Etapa
Prioridad
Origen
Asignado a
Fecha de alta
Última actividad
```

Estados permitidos:

```text
Pendiente
En gestión
Interesado
Oportunidad
Cotización
Cliente
Descartado
```

No usar `Visitado` o `Contactado` como estados principales.

---

# 8. BLOQUE — ÚLTIMA INTERACCIÓN

Mostrar la última activity real:

```text
Tipo
Fecha/hora
Resultado
Notas
Usuario
```

Ejemplo:

```text
LLAMADA REALIZADA
Hoy, 13:50

Conversé con Ariel Mattos.
Mostró interés en nuestras soluciones...

Juan Pérez

[ VER TODAS LAS INTERACCIONES ]
```

---

# 9. BLOQUE — RESUMEN COMERCIAL

Tres columnas:

```text
Necesidad probable
Enfoque comercial
Servicios a ofrecer
```

Ejemplo PRESOL:

```text
Necesidad probable
Traslado de maquinaria / implementos y carga-descarga.

Enfoque comercial
Presentar solución integral:
transporte + hidrogrúa + seguro.

Servicios a ofrecer
• Plataforma
• Hidrogrúa
• Malacate
• Seguro de carga
```

No duplicar esta información en otros bloques.

---

# 10. BLOQUE — ACTIVIDAD RECIENTE

Timeline vertical.

Mostrar últimas 5–8 actividades.

Cada item:

```text
Fecha/hora
Icono
Tipo
Usuario
Descripción
Resultado
```

Tipos:

```text
Visita
Llamada
WhatsApp
Email
Cotización
Comentario
Otro
```

Agregar:

```text
Ver todas
```

con filtros:

```text
Todas
Visitas
Llamadas
WhatsApp
Emails
Cotizaciones
Comentarios
```

---

# 11. BLOQUE — SEGUIMIENTOS ABIERTOS

Mostrar hasta 3 tareas abiertas.

Cada fila:

```text
checkbox
descripción
responsable
fecha
```

Ejemplo:

```text
□ Enviar caso de éxito        15 Sep
□ Llamar para coordinar       16 Sep
□ Preparar propuesta          18 Sep
```

Botones:

```text
Nuevo
Ver todos los seguimientos
```

Al completar una tarea:

```text
status = completed
completed_at = now()
```

Debe actualizar inmediatamente:

```text
Próxima acción
Seguimientos
Dashboard
```

---

# 12. BLOQUE — INFORMACIÓN DE EMPRESA

Mostrar:

```text
Dirección
Teléfonos
Sitio web
CUIT
Email general
Maps
LinkedIn empresa
```

Solo si los datos existen.

Agregar acciones:

```text
copiar
abrir
editar
```

---

# 13. WIDGET — CALIDAD DE DATOS

Mostrar:

```text
Calidad de datos
██████████████░░ 80%
```

Checklist sugerido:

```text
✓ Razón social
✓ Teléfono
✓ Dirección
✓ Sitio web
✓ Contacto principal
✓ Rubro
○ Email
○ Lat/Lng
○ Cantidad empleados
```

Pesos recomendados:

```text
Nombre / razón social      15
Ciudad                     10
Dirección                  10
Teléfono                   15
Sitio web                  10
Categoría / rubro          10
Contacto principal         15
Email                       5
Maps / lat-lng              5
Cantidad empleados          5
```

Total:

```text
100
```

Estados:

```text
0–39    Incompleto
40–79   Parcial
80–94   Enriquecido
95–100  Verificado
```

Si existe verificación manual, `Verificado` prevalece sobre score.

---

# 14. BOTÓN — ENRIQUECER

Si score < 80, mostrar:

```text
✨ Enriquecer datos
```

V1:

```text
buscar web
teléfono
dirección
ubicación
```

Nunca guardar automáticamente sin preview y confirmación.

---

# 15. BLOQUE — NOTAS INTERNAS

Accordion:

```text
Notas internas (N)
```

Mostrar:

```text
autor
fecha
nota
```

Dirección puede agregar comentarios.

---

# 16. BLOQUE — OPORTUNIDADES VINCULADAS

Accordion:

```text
Oportunidades vinculadas (N)
```

Cada oportunidad:

```text
Título
Estado
Valor estimado
Próximo paso
Responsable
```

Botón:

```text
+ Crear oportunidad
```

---

# 17. MINI VISUALIZACIONES OPCIONALES V1.5

No son obligatorias para V1.

## Historial de actividad

Mini bar chart últimos 30 días:

```text
Visitas
Llamadas
Emails
WhatsApp
```

## Progreso comercial

Timeline horizontal:

```text
Pendiente
En gestión
Interesado
Oportunidad
Cotización
Cliente
```

Solo usar si existe suficiente historial.

No llevar gráficos globales a la ficha individual.

---

# 18. MOBILE

Orden recomendado:

```text
Header
Acciones rápidas
Próxima acción
Contacto principal
Última interacción
Estado comercial
Resumen comercial
Seguimientos
Actividad reciente
Información empresa
Calidad de datos
Notas
Oportunidades
```

Agregar CTA fijo inferior:

```text
+ Registrar gestión
```

Acciones rápidas:

```text
Llamar
WhatsApp
Maps
```

No usar tablas en mobile.

---

# 19. COMPONENTES SUGERIDOS

```text
components/prospects/
  ProspectHeader.tsx
  QuickActions.tsx
  NextActionCard.tsx
  PrimaryContactCard.tsx
  CommercialStatusCard.tsx
  LastInteractionCard.tsx
  CommercialSummaryCard.tsx
  ActivityTimeline.tsx
  OpenFollowupsCard.tsx
  CompanyInfoCard.tsx
  DataQualityCard.tsx
  InternalNotesAccordion.tsx
  LinkedOpportunitiesAccordion.tsx
```

---

# 20. QUERY AGREGADA

Preferir:

```text
get_prospect_overview(prospect_id)
```

Debe devolver:

```text
prospect
primary_contact
next_task
latest_activity
recent_activities
open_tasks
opportunities
comments
data_quality
```

No hacer 8 queries secuenciales desde cliente.

Ejemplo:

```json
{
  "prospect": {
    "id": "...",
    "name": "Establecimientos Metalúrgicos Oncativo S.A.",
    "city": "Oncativo",
    "category": "Industria metalúrgica",
    "status": "in_progress",
    "priority": "high"
  },
  "primary_contact": {},
  "next_task": {},
  "latest_activity": {},
  "recent_activities": [],
  "open_tasks": [],
  "opportunities": [],
  "comments": [],
  "data_quality": {
    "score": 80,
    "missing": ["employee_count"]
  }
}
```

---

# 21. PERFORMANCE

Objetivo:

```text
carga inicial percibida < 1 s
```

Usar:

```text
server components cuando aplique
Promise.all
query agregada
skeletons
revalidate selectivo
```

---

# 22. EMPTY STATES

## Sin próxima acción

```text
No hay seguimiento programado.
[ + Crear seguimiento ]
```

## Sin contacto

```text
No hay contacto principal.
[ + Agregar contacto ]
```

## Sin actividad

```text
Todavía no hay interacciones registradas.
[ Registrar primera gestión ]
```

## Sin oportunidades

```text
No hay oportunidades vinculadas.
[ + Crear oportunidad ]
```

---

# 23. PERMISOS

## Comercial

Puede:

```text
registrar actividad
crear tareas
editar contacto
crear oportunidad
editar resumen comercial
```

## Dirección

Además:

```text
agregar comentarios
reasignar
cambiar prioridad
cambiar estado
```

## Admin

Todo.

---

# 24. TESTS OBLIGATORIOS

## Test 1
Prospecto con próxima tarea:
debe aparecer en `Próxima acción`.

## Test 2
Completar tarea:
debe desaparecer y mostrar la siguiente.

## Test 3
Registrar actividad:
debe actualizar `Última interacción`, `Actividad reciente` y `Última actividad`.

## Test 4
Cambiar estado:
debe actualizar Header y Estado comercial.

## Test 5
Agregar contacto principal:
debe mostrarse en Contacto principal.

## Test 6
Agregar website:
debe modificar Data Quality.

## Test 7
Crear oportunidad:
debe aparecer en Oportunidades vinculadas.

## Test 8
Mobile:
acciones principales visibles y utilizables.

---

# 25. CRITERIOS DE ACEPTACIÓN

La ficha V2 se considera terminada cuando:

- [ ] Header profesional implementado.
- [ ] Acciones rápidas funcionan.
- [ ] Próxima acción visible.
- [ ] Contacto principal visible.
- [ ] Estado comercial visible.
- [ ] Última interacción visible.
- [ ] Resumen comercial en tres columnas.
- [ ] Timeline de actividad funciona.
- [ ] Seguimientos abiertos funcionan.
- [ ] Información empresa está organizada.
- [ ] Calidad de datos calculada.
- [ ] Notas internas disponibles.
- [ ] Oportunidades vinculadas disponibles.
- [ ] Empty states correctos.
- [ ] No hay placeholders falsos.
- [ ] Mobile funciona correctamente.
- [ ] La ficha carga rápido.
- [ ] Toda la información proviene de datos reales.

---

# 26. ORDEN DE IMPLEMENTACIÓN

1. Auditar ficha actual.
2. Auditar schema y relaciones.
3. Crear `get_prospect_overview`.
4. Implementar Header.
5. Implementar Próxima acción.
6. Implementar Contacto principal.
7. Implementar Estado comercial.
8. Implementar Última interacción.
9. Implementar Resumen comercial.
10. Implementar Timeline.
11. Implementar Seguimientos.
12. Implementar Información empresa.
13. Implementar Data Quality.
14. Implementar Notas.
15. Implementar Oportunidades.
16. Ajustar mobile.
17. Testear con prospectos reales.
18. Entregar capturas desktop/mobile.

---

# 27. PRINCIPIO FINAL

La ficha de prospecto debe funcionar como:

```text
centro operativo de la relación comercial
```

y no como:

```text
pantalla de consulta de base de datos
```

La prioridad visual debe ser:

```text
Próxima acción
Contacto
Última interacción
Estado comercial
Resumen comercial
Seguimientos
Actividad
Datos de empresa
```

Ese orden debe mantenerse en desktop y mobile.
