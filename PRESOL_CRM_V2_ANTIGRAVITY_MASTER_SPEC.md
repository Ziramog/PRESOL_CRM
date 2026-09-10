# PRESOL CRM — V2 IMPROVEMENTS MASTER SPEC
## Dashboard de Gestión Comercial, Giras Flexibles y Rediseño de Prospectos

**Proyecto:** PRESOL CRM  
**Objetivo de esta versión:** transformar el CRM actual, que ya registra correctamente prospectos, actividades, tareas, oportunidades y comentarios, en una herramienta de **gestión comercial diaria y de dirección**, con foco en medir qué se hizo, dónde, con qué resultado y qué debe ocurrir después.

---

# 0. CONTEXTO ACTUAL

El CRM ya está operativo y contiene:

- Next.js 16
- Tailwind CSS
- shadcn/ui
- Supabase
- Autenticación
- Tablas principales:
  - `prospects`
  - `activities`
  - `tasks`
  - `trips`
  - `opportunities`
  - `comments`
- 287 prospectos importados inicialmente.
- 22 prospectos adicionales de Oliva y Tío Pujio.
- Normalización de rubros.
- Listado de prospectos.
- Filtros.
- Ficha de prospecto.
- Contactos.
- Creación manual de prospectos.
- Planificador de giras.
- Modo en ruta.
- Timeline.
- Registro de actividades.
- Comentarios de Dirección.
- Tareas.
- Oportunidades.
- Automatización de estados.
- Persistencia de filtros.
- Contact Picker API.
- PWA.
- Buen rendimiento de carga.

NO rehacer estas funcionalidades salvo cuando esta especificación lo solicite expresamente.

El objetivo ahora no es sumar funciones aisladas. El objetivo es reorganizar el CRM alrededor de tres preguntas:

1. **¿Qué actividad comercial se realizó?**
2. **¿Qué resultado produjo?**
3. **¿Qué debe hacerse ahora?**

---

# 1. PRINCIPIO CENTRAL DE LA V2

Actualmente el CRM está demasiado centrado visualmente en el objeto `prospect`.

La V2 debe estar centrada en:

```text
ACTIVIDAD COMERCIAL
    ↓
RESULTADO
    ↓
PRÓXIMO PASO
```

El prospecto sigue siendo una entidad fundamental, pero deja de ser el único centro de la experiencia.

La home principal del sistema debe convertirse en un **Dashboard de Actividad Comercial**.

---

# 2. REGLA CRÍTICA: `activities` ES LA FUENTE DE VERDAD

Una visita NO debe depender de que exista una `trip`.

Si el comercial registra:

```text
activity.type = visit
```

esa visita cuenta en todas las métricas correspondientes aunque:

```text
activity.trip_id = null
```

La tabla `trips` se usa para:

- planificación;
- agrupación;
- análisis de una jornada/gira;
- comparación plan vs ejecución.

NO es requisito para registrar actividad real.

## 2.1 Regla para contar prospectos visitados

Nunca contar simplemente cantidad de actividades.

Debe usarse:

```sql
COUNT(DISTINCT prospect_id)
```

para el conjunto de actividades:

```text
type = visit
```

dentro del rango de fechas seleccionado.

Ejemplo:

Un prospecto tiene:

- 1 visita
- 1 llamada
- 1 nota

Resultado:

```text
Prospectos visitados = 1
Actividades registradas = 3
```

Son métricas diferentes.

---

# 3. PRIORIDADES DE IMPLEMENTACIÓN

## P0 — Implementar inmediatamente

1. Nuevo Dashboard principal.
2. Métricas de actividad por fecha.
3. Prospectos visitados únicos.
4. Filtros por período.
5. Filtros por comercial.
6. Filtros por gira.
7. Resultados de actividad.
8. Próximas acciones.
9. Dashboard individual de una gira.
10. Crear gira retrospectivamente desde actividades ya registradas.

## P1 — Segunda etapa

11. Rediseño completo de ficha de prospecto.
12. Simplificación de cards del listado.
13. Resultado de actividad estructurado.
14. Separación clara entre:
    - información operativa;
    - información comercial;
    - datos de investigación.
15. Próxima acción visible arriba de la ficha.
16. Mejorar flujo de inicio/cierre de jornada.

## P2 — Gestión y analytics

17. Dashboard específico para Dirección.
18. Cobertura por ciudad.
19. Cobertura por corredor.
20. Cobertura por categoría.
21. Conversión.
22. Productividad por gira.
23. Comparativa entre giras.
24. Comparativa entre comerciales.
25. Pipeline de oportunidades.

## P3 — No hacer ahora

Postergar:

- IA de scraping;
- geolocalización en tiempo real;
- optimización de rutas avanzada;
- cálculo automático de transporte;
- presupuestos automáticos;
- gráficos decorativos;
- funciones no vinculadas directamente a gestión comercial.

---

# 4. NUEVA HOME — DASHBOARD COMERCIAL

La ruta principal luego del login debe ser:

```text
/dashboard
```

La PWA debe abrir preferentemente en:

```text
/dashboard
```

y NO forzar `/prospects`.

Modificar el comportamiento actual de redirección PWA.

---

# 5. DASHBOARD — ESTRUCTURA GENERAL

Debe funcionar correctamente en:

- desktop;
- tablet;
- mobile.

El diseño debe ser limpio y muy legible.

No llenar la pantalla de charts innecesarios.

La información principal debe ser visible sin scroll excesivo.

---

# 6. FILTROS GLOBALES DEL DASHBOARD

Arriba del dashboard:

```text
[ HOY ] [ AYER ] [ SEMANA ] [ MES ] [ PERSONALIZADO ]
```

Además:

```text
Comercial: Todos ▼
Gira: Todas ▼
Ciudad: Todas ▼
Categoría: Todas ▼
```

## Defaults

Al abrir:

```text
Período = HOY
Comercial = usuario actual
```

Para usuarios con rol Dirección / Admin:

```text
Comercial = Todos
```

Preferentemente conservar el último filtro utilizado.

---

# 7. MÉTRICAS PRINCIPALES DEL DASHBOARD

Fila principal:

```text
PROSPECTOS
VISITADOS
CONTACTADOS
INTERESADOS
OPORTUNIDADES
SEGUIMIENTOS
```

No todas tienen que ocupar la misma jerarquía.

Las más importantes:

```text
VISITADOS
INTERESADOS
OPORTUNIDADES
SEGUIMIENTOS
```

## 7.1 Prospectos

Total de prospectos activos dentro del scope seleccionado.

## 7.2 Visitados

```sql
COUNT(DISTINCT prospect_id)
```

donde exista una activity:

```text
type = visit
activity_at dentro del período
```

## 7.3 Contactados

Prospectos únicos con alguna actividad considerada contacto efectivo.

Posibles tipos:

```text
visit
call
email
whatsapp
```

Excluir resultados:

```text
no_answer
invalid_contact
```

La implementación final debe permitir ajustar esta lógica fácilmente.

## 7.4 Interesados

Prospectos únicos cuya actividad tenga resultado:

```text
interested
requested_info
requested_quote
follow_up
```

## 7.5 Oportunidades

Cantidad de oportunidades creadas dentro del período seleccionado.

Adicionalmente mostrar valor potencial si existe.

## 7.6 Seguimientos

Tareas pendientes cuyo tipo/contexto sea comercial.

Mostrar por separado:

```text
Vencidas
Hoy
Próximas
```

---

# 8. SEGUNDO BLOQUE — RESULTADOS DEL PERÍODO

Mostrar distribución de resultados estructurados.

Ejemplo:

```text
RESULTADOS DE HOY

Pidió cotización           2
Interesado                 4
Seguimiento                5
Contacto conseguido        3
No estaba                  4
No respondió               2
Sin interés                1
Datos incorrectos          1
```

Preferir lista + barras simples.

No hacer gráficos complejos.

Cada resultado debe ser clickeable y abrir prospectos correspondientes.

---

# 9. TERCER BLOQUE — PRÓXIMAS ACCIONES

Mostrar:

```text
PRÓXIMAS ACCIONES

3 vencidas
5 para hoy
8 próximas
```

Debajo:

```text
09:00 — Ascanelli — llamar Logística
11:30 — Empresa X — enviar presentación
15:00 — Empresa Y — revisar cotización
```

Cada fila debe ser clickeable.

---

# 10. BLOQUE — ACTIVIDAD RECIENTE

Timeline global del período.

Ejemplo:

```text
14:32
Juan visitó Ascanelli
Resultado: seguimiento

13:58
Juan visitó Empresa X
Resultado: pidió cotización

13:20
Dirección comentó en Empresa Z
```

Debe permitir filtrar:

```text
Todos
Visitas
Llamadas
Comentarios
Oportunidades
```

---

# 11. DIFERENCIAR DASHBOARD COMERCIAL VS DIRECCIÓN

No duplicar todo el frontend.

Usar mismo motor de datos, pero distinta jerarquía.

## Comercial

Título:

```text
Mi jornada
```

Priorizar:

```text
Visitados hoy
Contactados
Próximas acciones
Tareas vencidas
Gira actual
Últimas indicaciones de Dirección
Mis oportunidades
```

## Dirección / Admin

Título:

```text
Gestión comercial
```

Priorizar:

```text
Actividad total
Visitados por comercial
Resultados
Oportunidades
Seguimientos pendientes
Cobertura
Actividad por zona
Actividad por gira
```

---

# 12. MÉTRICA DE COBERTURA

Agregar concepto de `coverage`.

Ejemplo:

```text
OLIVA

Prospectos Clase A      37
Visitados               19
Pendientes              18
Cobertura               51%
```

Fórmula:

```text
coverage = unique prospects visited / total prospects in scope
```

Scopes soportados:

- ciudad;
- corredor;
- microzona;
- categoría;
- clase;
- comercial;
- gira.

---

# 13. PRODUCTIVIDAD DE GIRA

Cada gira debe tener dashboard propio.

Ruta sugerida:

```text
/trips/[id]
```

Header:

```text
GIRA COMERCIAL

Oliva → Tío Pujio
09 septiembre 2026
Juan
```

KPIs:

```text
PLANIFICADOS
VISITADOS
NO VISITADOS
CONTACTO EFECTIVO
INTERESADOS
OPORTUNIDADES
SEGUIMIENTOS
```

Ejemplo:

```text
Planificados        18
Visitados           14
Cumplimiento        78%
Contacto efectivo   10
Interesados          5
Oportunidades        2
```

---

# 14. PLAN VS REALIDAD EN GIRA

La gira debe distinguir:

```text
planned prospects
actual visited prospects
```

Un prospecto puede haber sido visitado aunque no estuviera planificado.

Mostrar:

```text
Planificados y visitados
Planificados no visitados
No planificados visitados
```

Esto es importante porque en campo aparecen nuevos prospectos.

---

# 15. NO OBLIGAR A CREAR GIRA ANTES DE TRABAJAR

Nunca bloquear:

- visita;
- llamada;
- comentario;
- tarea;
- oportunidad;

por falta de `trip_id`.

---

# 16. CREAR GIRA RETROSPECTIVAMENTE

Nueva acción:

```text
CREAR GIRA DESDE ACTIVIDADES
```

Ubicaciones posibles:

- Dashboard.
- Página de Giras.

Flujo:

```text
Seleccionar fecha
Seleccionar comercial
```

El sistema detecta:

```text
prospectos únicos con activity.type = visit
```

Mostrar:

```text
09/09/2026
Juan

12 prospectos visitados
```

Botón:

```text
[ CREAR GIRA CON ESTAS VISITAS ]
```

Formulario:

```text
Nombre:
Oliva — Tío Pujio

Fecha:
09/09/2026

Comercial:
Juan
```

Al guardar:

1. crear `trip`;
2. crear registros `trip_stops` si existen;
3. asignar `trip_id` a las activities seleccionadas;
4. NO duplicar activities;
5. NO cambiar `activity_at` ni `created_at`;
6. NO cambiar resultados;
7. NO cambiar estado de prospectos.

Debe ser operación segura.

---

# 17. MEJORA DE MODELO DE DATOS PARA GIRA

Verificar si existe:

```text
trip_stops
```

Si no existe, crear.

Schema sugerido:

```sql
create table if not exists trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  prospect_id uuid not null references prospects(id),
  planned boolean not null default true,
  sequence integer,
  status text default 'pending',
  arrived_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique(trip_id, prospect_id)
);
```

Statuses sugeridos:

```text
pending
visited
skipped
cancelled
```

---

# 18. RELACIÓN `activities` ↔ `trips`

Agregar si no existe:

```sql
alter table activities
add column if not exists trip_id uuid references trips(id);
```

Crear índice:

```sql
create index if not exists idx_activities_trip_id
on activities(trip_id);
```

Crear también índices:

```sql
create index if not exists idx_activities_created_at
on activities(created_at);

create index if not exists idx_activities_prospect_id_created_at
on activities(prospect_id, created_at desc);

create index if not exists idx_activities_type_created_at
on activities(type, created_at);
```

---

# 19. INICIO DE JORNADA — OPCIONAL

No bloquear actividad.

Cuando un comercial registra la primera visita del día y no existe gira activa:

Mostrar toast / diálogo no invasivo:

```text
Primera visita registrada hoy.

¿Querés iniciar una jornada comercial?

[ INICIAR JORNADA ]
[ AHORA NO ]
```

Si elige iniciar:

crear `trip` mínima:

```text
name = "Gira DD/MM/YYYY"
date = today
owner = current user
status = active
```

El nombre puede editarse después.

---

# 20. CIERRE DE JORNADA

Si existe trip activa:

Botón:

```text
CERRAR GIRA
```

Mostrar resumen antes de cerrar:

```text
12 visitados
8 contactos efectivos
4 interesados
2 oportunidades
5 seguimientos
```

Guardar:

```text
status = completed
ended_at
```

---

# 21. REDISEÑO DE FICHA DE PROSPECTO

La ficha actual contiene demasiada información con una jerarquía insuficiente.

La V2 debe separar:

```text
1. Operación
2. Comercial
3. Investigación / Datos
```

---

# 22. NUEVA FICHA — HEADER

Mostrar:

```text
ASCANELLI S.A.

Maquinaria agrícola · Oncativo

Clase A
Alta prioridad
Visitado
```

Acciones principales:

```text
[ LLAMAR ]
[ MAPS ]
[ REGISTRAR ACTIVIDAD ]
```

En mobile deben quedar muy accesibles.

---

# 23. PRIMER BLOQUE — PRÓXIMA ACCIÓN

Debe estar inmediatamente debajo del header.

Ejemplo:

```text
PRÓXIMA ACCIÓN

Llamar a Carlos / Logística
11 Sep · 09:00

Dirección:
Consultar frecuencia mensual de despachos.

[ COMPLETAR ]
```

Si no hay tarea:

```text
Sin próxima acción definida.

[ + CREAR SEGUIMIENTO ]
```

Esta ausencia debe ser visualmente evidente.

---

# 24. SEGUNDO BLOQUE — CONTACTO PRINCIPAL

Mostrar máximo:

- nombre;
- cargo;
- teléfono;
- email.

Ejemplo:

```text
Carlos Pérez
Logística

3571...
carlos@...

[ LLAMAR ]
[ WHATSAPP ]
```

Otros contactos:

```text
Ver 2 contactos más
```

No mostrar todos por default.

---

# 25. TERCER BLOQUE — ÚLTIMA INTERACCIÓN

Mostrar la última activity relevante.

Ejemplo:

```text
ÚLTIMA INTERACCIÓN

09 SEP · VISITA

Hablamos con administración.
Responsable de logística no estaba.

Resultado:
Volver a contactar.

Juan · 14:32
```

Debajo:

```text
[ VER HISTORIAL COMPLETO ]
```

---

# 26. CUARTO BLOQUE — INFORMACIÓN COMERCIAL

Colapsado por default:

```text
▸ INFORMACIÓN COMERCIAL
```

Contenido:

```text
Necesidad probable
Enfoque comercial
Servicios potenciales
Oportunidades abiertas
```

---

# 27. UNIFICAR GANCHO + SERVICIOS

Actualmente existen conceptos similares:

```text
Gancho Comercial
Servicios a Ofrecer
```

No eliminarlos de DB todavía.

En UI agrupar bajo:

```text
ENFOQUE COMERCIAL
```

Puede contener:

```text
Argumento sugerido
Servicios potenciales
```

No duplicar textos.

---

# 28. QUINTO BLOQUE — DATOS DEL PROSPECTO

Colapsado por default:

```text
▸ DATOS DEL PROSPECTO
```

Mover aquí:

- dirección;
- ciudad;
- corredor;
- microzona;
- categoría;
- sector original;
- fuente;
- evidencia;
- calidad del dato;
- calidad de teléfono;
- datos pendientes;
- web;
- metadata de importación.

Estos datos son importantes para mantenimiento de base, pero no deben dominar la experiencia comercial.

---

# 29. HISTORIAL

Mantener timeline actual.

Mejorarlo con filtros:

```text
Todos
Visitas
Llamadas
Emails
WhatsApp
Comentarios
Oportunidades
```

Agrupar por fecha.

No perder capacidad de borrar eventos creados por error según permisos actuales.

---

# 30. SIMPLIFICAR CARDS DEL LISTADO DE PROSPECTOS

Objetivo:

una card debe poder interpretarse en 1–2 segundos.

Mostrar solamente:

```text
EMPRESA
Categoría · Ciudad

Clase / prioridad
Estado

Última actividad
Próxima acción
```

Ejemplo:

```text
ASCANELLI

Maquinaria agrícola · Oncativo

A · Alta prioridad
Visitado

Última actividad
Hoy · 14:32

Próxima acción
Llamar 11 Sep
```

Ocultar del listado:

- necesidad probable completa;
- gancho;
- servicios;
- evidencia;
- fuente;
- datos técnicos;
- textos largos.

---

# 31. ESTADO DEL PROSPECTO VS RESULTADO DE ACTIVIDAD

No mezclar estos conceptos.

## Prospect status

Foto actual del proceso comercial.

Enum sugerido:

```text
pending
contacted
visited
opportunity
quote
customer
discarded
```

Labels:

```text
Pendiente
Contactado
Visitado
Oportunidad
Cotización
Cliente
Descartado
```

## Activity result

Resultado de una interacción concreta.

Enum recomendado:

```text
no_answer
not_available
contact_made
interested
requested_info
requested_quote
follow_up
not_interested
invalid_data
other
```

Labels:

```text
No respondió
No estaba
Contacto conseguido
Interesado
Pidió información
Pidió cotización
Seguimiento
Sin interés
Datos incorrectos
Otro
```

---

# 32. RESULTADO ESTRUCTURADO OBLIGATORIO

Para nuevas activities relevantes:

```text
visit
call
email
whatsapp
```

el campo `result` debe elegirse desde catálogo.

Agregar o mantener:

```text
notes
```

como texto libre.

Ejemplo:

```text
Resultado:
Pidió cotización

Notas:
Necesita mover cosechadora desde...
```

Esto es imprescindible para analytics.

---

# 33. MIGRACIÓN DE RESULTADOS EXISTENTES

NO destruir los datos existentes.

Si actualmente `result` tiene textos libres, crear transición segura.

Posible estrategia:

```text
activity_result_code text
activity_result_label text
result_legacy text
```

O reutilizar `result` si ya soporta valores consistentes.

Crear script de mapeo para valores históricos detectables.

Ejemplo:

```text
"no estaba" -> not_available
"pidió cotización" -> requested_quote
"interesado" -> interested
```

Los no mapeables:

```text
other
```

y conservar texto original en `notes`/`result_legacy`.

NO perder información histórica.

---

# 34. MOTOR AUTOMÁTICO DE ESTADOS

Mantener lógica existente.

Ajustarla a resultados estructurados.

Ejemplos:

```text
visit -> status >= visited
```

```text
call + contact_made -> status >= contacted
```

```text
requested_quote -> status = quote
```

```text
opportunity created -> status = opportunity
```

Pero NO degradar estados automáticamente.

Ejemplo:

si un prospecto ya está en:

```text
quote
```

una llamada sin respuesta NO debe volverlo a:

```text
contacted
```

Implementar ranking de estados.

Ejemplo:

```ts
pending = 10
contacted = 20
visited = 30
opportunity = 40
quote = 50
customer = 60
discarded = special
```

---

# 35. PRÓXIMO PASO COMO CONCEPTO CENTRAL

Una visita exitosa o fallida debería terminar preferentemente con:

```text
¿Hay próximo paso?
```

Opciones:

```text
No
Crear tarea
```

Si crear tarea:

```text
Tipo
Fecha
Hora opcional
Responsable
Descripción
```

Ejemplo:

```text
Llamar
11 Sep
Juan
Hablar con Carlos de Logística
```

Esto debe alimentar Dashboard.

---

# 36. INDICADOR “SIN PRÓXIMO PASO”

Agregar query:

```text
prospectos visitados/interesados
sin tarea abierta
sin oportunidad abierta
```

Mostrar en Dirección:

```text
5 prospectos requieren definición de próximo paso
```

Esto es un indicador de calidad comercial.

---

# 37. QUERIES / RPC PARA DASHBOARD

Evitar hacer 10–20 queries independientes desde cliente.

Preferir:

- SQL views;
- RPC;
- server-side aggregation.

Crear función ejemplo:

```text
get_commercial_dashboard(
  from_date,
  to_date,
  user_id?,
  trip_id?,
  city?,
  category?
)
```

Retornar JSON agregado.

Ejemplo:

```json
{
  "prospects_total": 309,
  "visited_unique": 12,
  "contacted_unique": 16,
  "interested_unique": 4,
  "opportunities": 2,
  "tasks_overdue": 3,
  "tasks_today": 5,
  "results": [],
  "recent_activity": []
}
```

---

# 38. TIMEZONE

Muy importante.

La operación es en Argentina.

Usar timezone:

```text
America/Argentina/Cordoba
```

Nunca definir “hoy” usando UTC puro.

Ejemplo:

```text
Hoy = 00:00 a 23:59:59
America/Argentina/Cordoba
```

Esto es imprescindible para que visitas de tarde/noche no queden imputadas al día incorrecto.

---

# 39. FECHA DE ACTIVIDAD

Verificar diferencia entre:

```text
created_at
activity_at
```

Si no existe `activity_at`, considerar agregarlo.

Motivo:

una actividad puede cargarse más tarde que cuando realmente ocurrió.

Schema sugerido:

```sql
alter table activities
add column if not exists activity_at timestamptz;
```

Migración:

```text
activity_at = created_at
```

para registros anteriores.

Para nuevas actividades:

default:

```text
now()
```

pero editable.

Todos los dashboards deben usar preferentemente:

```text
activity_at
```

no `created_at`.

---

# 40. ACTIVIDAD REGISTRADA HOY VS ACTIVIDAD OCURRIDA HOY

No confundir:

```text
created_at
activity_at
```

Métrica comercial:

usar `activity_at`.

Auditoría:

usar `created_at`.

---

# 41. DASHBOARD DE DIRECCIÓN — FASE P2

Agregar tabs:

```text
Resumen
Comerciales
Zonas
Giras
Oportunidades
```

## Resumen

- visitados;
- interesados;
- oportunidades;
- seguimientos;
- cobertura.

## Comerciales

Tabla:

```text
Comercial | Visitados | Contactados | Interesados | Oportunidades
```

## Zonas

```text
Ciudad | Prospectos | Visitados | Cobertura | Interesados
```

## Giras

```text
Gira | Fecha | Comercial | Planificados | Visitados | Interesados | Oportunidades
```

## Oportunidades

Pipeline resumido.

---

# 42. CONVERSIÓN

Implementar cuando haya datos suficientes.

Métricas:

```text
visitados -> interesados
interesados -> oportunidad
oportunidad -> cotización
cotización -> cliente
```

Ejemplo:

```text
Visitados:      100
Interesados:     32
Oportunidades:   12
Cotizaciones:     7
Clientes:         3
```

No presentar ratios si denominador = 0.

---

# 43. FILTROS DEL LISTADO DE PROSPECTOS

Mantener los filtros existentes.

Agregar:

```text
Visitado hoy
Sin visitar
Con próxima acción
Sin próxima acción
Con oportunidad
Visitado en rango
```

Mantener persistencia actual en URL/localStorage.

---

# 44. BADGES

Reducir cantidad visual.

Regla:

máximo 3 badges visibles simultáneamente en una card.

Prioridad recomendada:

1. Estado.
2. Clase/Prioridad.
3. Indicador urgente.

Ejemplo:

```text
VISITADO
A
SEGUIMIENTO VENCIDO
```

---

# 45. MOBILE FIRST

Este CRM se usa en calle.

Priorizar mobile.

Requisitos:

- botones táctiles grandes;
- no hover como interacción necesaria;
- CTA registrar actividad siempre accesible;
- navegación rápida;
- loaders mínimos;
- mantener filtros;
- bottom sheets cuando corresponda;
- evitar tablas complejas en móvil.

Dashboard mobile:

cards KPI apiladas/2 columnas.

---

# 46. QUICK ACTION GLOBAL

Agregar botón flotante en mobile:

```text
+
```

Opciones:

```text
Registrar visita
Registrar llamada
Crear prospecto
Crear tarea
Crear oportunidad
```

No obligar a navegar primero hasta un módulo.

---

# 47. BÚSQUEDA RÁPIDA DE EMPRESA AL REGISTRAR ACTIVIDAD

Cuando se usa Quick Action:

```text
Registrar visita
```

mostrar búsqueda:

```text
Buscar empresa...
```

Seleccionar prospect.

Luego formulario de actividad.

Esto permite registrar una visita aun cuando el usuario no entró desde la ficha.

---

# 48. AUDITORÍA

Mantener trazabilidad.

Para cambios relevantes registrar:

```text
user_id
entity_type
entity_id
action
old_value
new_value
timestamp
```

Especialmente:

- borrar actividad;
- modificar resultado;
- cambiar estado manualmente;
- reasignar gira;
- editar oportunidad.

---

# 49. RLS

No romper las políticas actuales.

Roles sugeridos:

```text
commercial
director
admin
```

## Comercial

Puede:

- leer prospectos;
- crear actividades;
- editar sus actividades;
- crear tareas;
- gestionar sus tareas;
- crear oportunidades;
- participar en giras;
- leer comentarios de Dirección.

## Dirección

Además:

- ver actividad de todos;
- comentar;
- reasignar tareas;
- ver dashboards generales;
- ver todas las giras;
- editar información comercial.

## Admin

Todo.

---

# 50. NO BORRAR HISTORIAL

Evitar hard delete donde sea posible.

Para activities considerar:

```text
deleted_at
deleted_by
```

Soft delete preferido.

Si actualmente existe hard delete desde timeline, evaluar migrarlo a soft delete en esta fase o dejarlo como pendiente P1.

Los dashboards deben excluir:

```text
deleted_at is not null
```

---

# 51. EMPTY STATES

El dashboard debe funcionar correctamente aunque no haya actividad.

Ejemplo:

```text
Todavía no hay visitas registradas hoy.

[ REGISTRAR PRIMERA ACTIVIDAD ]
```

Nunca mostrar una colección de ceros sin contexto.

---

# 52. ESTADOS DE CARGA

Implementar skeletons.

Evitar layout shift.

No bloquear toda la aplicación por cargar un KPI secundario.

---

# 53. PERFORMANCE

Mantener objetivo actual de rendimiento.

Dashboard:

- agregar server-side;
- evitar N+1;
- índices correctos;
- `Promise.all` cuando sea necesario;
- preferir SQL aggregation.

No sacrificar corrección por optimización prematura.

---

# 54. URL STATE

Filtros Dashboard deben reflejarse en URL.

Ejemplo:

```text
/dashboard?period=today&user=xxx&trip=yyy
```

Permite que Dirección comparta una vista específica.

---

# 55. EXPORTACIÓN — FUTURO CERCANO

Preparar arquitectura para:

```text
Exportar resumen de gira
```

Formato futuro:

- PDF;
- Excel.

No implementar si retrasa P0.

---

# 56. COMPONENTES SUGERIDOS

```text
components/
  dashboard/
    DashboardFilters.tsx
    KPIGrid.tsx
    KPIStatCard.tsx
    ResultBreakdown.tsx
    UpcomingTasks.tsx
    RecentActivity.tsx
    CoverageCard.tsx
    TripPerformance.tsx

  prospects/
    ProspectHeader.tsx
    NextActionCard.tsx
    PrimaryContactCard.tsx
    LastInteractionCard.tsx
    CommercialInfoSection.tsx
    ProspectDataSection.tsx
    ProspectActivityTimeline.tsx

  trips/
    TripHeader.tsx
    TripKPIs.tsx
    TripPlanVsActual.tsx
    TripStopsList.tsx
    CreateTripFromActivities.tsx
```

---

# 57. SERVER / DOMAIN LAYER

No colocar toda la lógica en componentes React.

Sugerido:

```text
lib/
  dashboard/
    queries.ts
    metrics.ts
    filters.ts

  trips/
    queries.ts
    service.ts

  activities/
    service.ts
    result-codes.ts

  prospects/
    status-engine.ts
```

---

# 58. RESULT CODES CENTRALIZADOS

Crear una única definición:

```ts
export const ACTIVITY_RESULTS = {
  no_answer: "No respondió",
  not_available: "No estaba",
  contact_made: "Contacto conseguido",
  interested: "Interesado",
  requested_info: "Pidió información",
  requested_quote: "Pidió cotización",
  follow_up: "Seguimiento",
  not_interested: "Sin interés",
  invalid_data: "Datos incorrectos",
  other: "Otro",
} as const;
```

No duplicar strings en componentes.

---

# 59. STATUS CODES CENTRALIZADOS

```ts
export const PROSPECT_STATUS = {
  pending: "Pendiente",
  contacted: "Contactado",
  visited: "Visitado",
  opportunity: "Oportunidad",
  quote: "Cotización",
  customer: "Cliente",
  discarded: "Descartado",
} as const;
```

---

# 60. MIGRACIONES

Toda modificación de DB debe:

1. tener migration versionada;
2. poder correr en entorno existente;
3. usar `if not exists` cuando corresponda;
4. no eliminar columnas actuales sin migración;
5. preservar historial.

Antes de migrar, hacer backup de tablas afectadas o snapshot de Supabase si está disponible.

---

# 61. TESTS CRÍTICOS P0

## Test 1 — Visita sin gira

Crear:

```text
activity.type = visit
trip_id = null
```

Resultado esperado:

```text
Dashboard Visitados = +1
```

## Test 2 — Dos actividades mismo prospecto

Registrar:

```text
visit
call
```

en mismo prospecto.

Resultado:

```text
Visitados = 1
Actividades = 2
```

## Test 3 — Dos visitas mismo prospecto mismo día

Resultado:

```text
Visitados = 1
Visitas = 2
```

si se muestra métrica de visitas totales.

## Test 4 — Dos prospectos

Registrar visita a A y B.

Resultado:

```text
Visitados = 2
```

## Test 5 — Filtro por comercial

Juan registra 3 visitas.

Otro usuario registra 2.

Filtro Juan:

```text
Visitados = 3
```

Todos:

```text
Visitados = 5
```

## Test 6 — Filtro por gira

3 actividades con trip A.

4 sin trip.

Filtro gira A:

```text
Visitados = prospectos únicos de trip A
```

## Test 7 — Gira retrospectiva

Actividades existentes sin `trip_id`.

Crear gira retrospectiva.

Resultado:

- no se duplican activities;
- aparecen bajo nueva gira;
- dashboard diario no cambia;
- dashboard de gira las muestra.

## Test 8 — Timezone

Activity:

```text
2026-09-09 23:30 Argentina
```

Debe contar como:

```text
09/09/2026
```

aunque UTC sea día siguiente.

## Test 9 — Resultado estructurado

Guardar:

```text
requested_quote
```

Dashboard debe mostrar:

```text
Pidió cotización
```

## Test 10 — Estado no se degrada

Prospecto:

```text
status = quote
```

Registrar:

```text
call + no_answer
```

Resultado esperado:

```text
status = quote
```

---

# 62. CRITERIOS DE ACEPTACIÓN — P0

P0 se considera terminado cuando:

- [ ] Login redirige a Dashboard.
- [ ] Dashboard abre en período Hoy.
- [ ] Visitados cuenta prospectos únicos.
- [ ] Visitas sin gira aparecen.
- [ ] Funciona filtro Hoy.
- [ ] Funciona filtro Semana.
- [ ] Funciona filtro personalizado.
- [ ] Funciona filtro por comercial.
- [ ] Funciona filtro por gira.
- [ ] Resultados aparecen estructurados.
- [ ] Próximas acciones aparecen correctamente.
- [ ] Actividad reciente funciona.
- [ ] Cada KPI es navegable a su detalle.
- [ ] Gira tiene dashboard propio.
- [ ] Se puede crear gira retrospectiva.
- [ ] No se duplica ninguna actividad.
- [ ] Mobile funciona correctamente.
- [ ] Timezone Argentina está verificado.

---

# 63. CRITERIOS DE ACEPTACIÓN — P1

- [ ] Ficha de prospecto rediseñada.
- [ ] Próxima acción aparece primero.
- [ ] Contacto principal visible.
- [ ] Última interacción visible.
- [ ] Información comercial colapsada.
- [ ] Datos de investigación colapsados.
- [ ] Cards simplificadas.
- [ ] Activity result usa catálogo estructurado.
- [ ] Notas siguen permitiendo texto libre.
- [ ] Motor de estados no degrada etapas.
- [ ] Quick Action mobile funciona.

---

# 64. CRITERIOS DE ACEPTACIÓN — P2

- [ ] Dashboard Dirección.
- [ ] Cobertura por ciudad.
- [ ] Cobertura por corredor.
- [ ] Cobertura por categoría.
- [ ] Comparativa por comercial.
- [ ] Comparativa por gira.
- [ ] Conversión.
- [ ] Pipeline de oportunidades.
- [ ] Indicador de prospectos sin próximo paso.

---

# 65. UX — REGLA GENERAL

Antes de mostrar un dato preguntar:

```text
¿Este dato ayuda al comercial a decidir qué hacer?
```

Si no, moverlo a sección secundaria.

El vendedor en calle debe ver primero:

```text
Quién es
Con quién hablar
Qué pasó
Qué hacer ahora
Qué ofrecer
```

---

# 66. NO HACER

No:

- rehacer el proyecto;
- reemplazar Supabase;
- reemplazar Next.js;
- migrar a MongoDB;
- introducir un segundo backend;
- borrar historial;
- eliminar features actuales que funcionan;
- obligar a usar Gira;
- hacer que registrar una visita dependa de una gira;
- mezclar estado y resultado;
- usar texto libre como única fuente para analytics;
- llenar dashboard con gráficos sin propósito;
- complicar mobile.

---

# 67. DEFINITION OF DONE GENERAL

La V2 se considera exitosa si Dirección puede abrir el CRM y responder en menos de 10 segundos:

```text
¿Cuántos prospectos visitamos hoy?
```

y también:

```text
¿Qué resultado tuvimos?
```

```text
¿Quién necesita seguimiento?
```

```text
¿Qué ocurrió en una gira determinada?
```

```text
¿Qué comercial hizo qué?
```

```text
¿Qué zonas estamos cubriendo?
```

Y el comercial puede responder en menos de 10 segundos:

```text
¿Qué tengo que hacer ahora?
```

---

# 68. ORDEN EXACTO DE EJECUCIÓN PARA ANTIGRAVITY

## Fase 1 — Auditoría técnica

Antes de modificar código:

1. inspeccionar schema real Supabase;
2. inspeccionar enums/strings actuales;
3. inspeccionar relación `trips` / `activities`;
4. inspeccionar sistema de roles;
5. inspeccionar PWA redirect;
6. inspeccionar motor automático de estados;
7. inspeccionar estructura actual del dashboard si existe;
8. documentar diferencias entre esta spec y código real.

NO asumir schema.

## Fase 2 — Datos y migraciones

Implementar:

1. `activity_at` si falta;
2. `trip_id` en activities si falta;
3. `trip_stops` si falta;
4. índices;
5. catálogo resultados;
6. estrategia de migración legacy;
7. timezone consistente.

Correr tests.

## Fase 3 — Motor de métricas

Construir `dashboard query / RPC` antes de UI.

Validar manualmente con registros existentes.

Verificar especialmente las visitas realizadas el 09/09/2026.

El sistema debe ser capaz de contarlas aunque no tengan gira.

## Fase 4 — Dashboard P0

Construir:

- filtros;
- KPIs;
- resultados;
- próximas acciones;
- actividad reciente.

Mobile primero.

## Fase 5 — Giras V2

Implementar:

- dashboard de gira;
- plan vs realidad;
- gira retrospectiva;
- inicio/cierre opcional.

## Fase 6 — Prospect V2

Rediseñar ficha.

No alterar datos innecesariamente.

## Fase 7 — Dirección

Cobertura, comerciales, zonas, comparativas.

---

# 69. ENTREGABLES ESPERADOS DE ANTIGRAVITY

Al finalizar cada fase, entregar:

```text
1. Qué se modificó.
2. Qué archivos cambiaron.
3. Qué migrations se ejecutaron.
4. Qué decisiones tomó.
5. Qué tests realizó.
6. Qué quedó pendiente.
7. Capturas del mobile y desktop si corresponde.
```

No responder solamente:

```text
"implementado"
```

---

# 70. PRIMER MILESTONE OBLIGATORIO

Antes de avanzar al rediseño completo, demostrar esta secuencia real:

```text
1. Existen actividades de visita registradas hoy.
2. Algunas NO pertenecen a una gira.
3. Dashboard muestra correctamente:
   - prospectos únicos visitados;
   - resultados;
   - comercial;
   - próximas acciones.
4. Se crea una gira retrospectiva.
5. Las mismas actividades aparecen en la gira.
6. No cambian los números globales.
7. No se duplica ningún evento.
```

Si esto funciona, la abstracción central de CRM V2 está correctamente implementada.

---

# 71. PRINCIPIO FINAL

El sistema debe adaptarse al trabajo real del comercial.

No imponer al comercial una estructura administrativa antes de poder registrar lo que hizo.

La lógica correcta es:

```text
registrar realidad primero
organizar y analizar después
```

La `activity` representa la realidad.

La `trip` representa el contexto.

El `dashboard` representa la gestión.

El `task` representa el próximo paso.

El `opportunity` representa el potencial comercial.

Esta separación debe mantenerse en toda la arquitectura V2.
