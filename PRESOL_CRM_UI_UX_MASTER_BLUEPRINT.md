# PRESOL CRM — UI/UX MASTER BLUEPRINT
## Documento rector de producto, presentación de datos y arquitectura visual

**Versión:** 1.0  
**Objetivo:** definir cómo debe verse, organizarse y comportarse PRESOL CRM a partir de la experiencia real de uso, la estructura ya implementada y la evolución necesaria hacia una herramienta de gestión comercial profesional.

---

# 0. PRINCIPIO RECTOR

PRESOL CRM no debe sentirse como una base de datos con formularios.

Debe sentirse como un **sistema de gestión comercial**.

La experiencia debe responder rápidamente:

```text
¿Qué pasó?
¿Qué resultado tuvo?
¿Qué tengo que hacer ahora?
¿Qué oportunidades existen?
¿Qué está viendo Dirección?
```

La jerarquía general será:

```text
ACTIVIDAD
→ RESULTADO
→ PRÓXIMO PASO
→ OPORTUNIDAD
→ CONVERSIÓN
```

El CRM debe priorizar:

- lectura rápida;
- contexto;
- comparación;
- seguimiento;
- trazabilidad;
- acción inmediata.

---

# 1. ARQUITECTURA FUNCIONAL PRINCIPAL

La navegación principal debe organizarse así:

```text
Dashboard
Prospectos
Giras
Seguimientos / Agenda
Oportunidades
Dirección
Reportes
Configuración
```

Opcional V2:

```text
Enriquecimiento
Cotizaciones
```

No crear módulos redundantes.

---

# 2. ROLES

## Comercial

Debe poder responder:

```text
¿Qué tengo que hacer hoy?
¿Qué empresas visité?
¿Qué resultado obtuve?
¿A quién tengo que volver a contactar?
¿Qué oportunidades estoy manejando?
```

## Dirección

Debe poder responder:

```text
¿Qué actividad comercial se hizo?
¿Qué comerciales están activos?
¿Qué zonas funcionan mejor?
¿Qué resultados están apareciendo?
¿Qué oportunidades están abiertas?
¿Dónde tenemos problemas de seguimiento?
```

## Admin

Gestión completa del sistema.

---

# 3. LENGUAJE VISUAL

Mantener estética:

- profesional;
- limpia;
- moderna;
- empresarial;
- alta legibilidad;
- sin exceso de decoración;
- sin exceso de colores;
- sin elementos visuales sin función.

Paleta:

- azul PRESOL como color principal;
- verde para éxito / avance;
- amarillo para atención;
- rojo para vencido / riesgo;
- gris neutro para información secundaria;
- violeta solo si se usa consistentemente para oportunidad/cotización.

Evitar:

- demasiados badges simultáneos;
- tarjetas excesivamente vacías;
- paneles gigantes con poco contenido;
- charts sin interpretación;
- sombras exageradas;
- saturación visual.

---

# 4. DASHBOARD COMERCIAL — PANTALLA PRINCIPAL

Ruta:

```text
/dashboard
```

Debe ser la home luego del login.

---

# 5. BLOQUE PRINCIPAL — AYER / HOY / ESTA SEMANA

Mostrar tres cards:

```text
AYER
HOY
ESTA SEMANA
```

## Métricas por card

```text
Gestiones / Visitados
Contactos efectivos
Interesados
Oportunidades
Seguimientos
Tasa de contacto
```

Recomendación final:

si la actividad principal del CRM es terreno:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
Seguimientos
```

Si se quiere una visión más general:

```text
Gestiones
Contactos efectivos
Interesados
Oportunidades
Seguimientos
```

La métrica elegida debe mantenerse estable.

---

# 6. DEFINICIONES DE MÉTRICAS

## Visitados

Prospectos únicos con:

```text
activity.type = visit
```

en el período.

## Contactos efectivos

Prospectos únicos donde hubo interacción útil bidireccional.

## Interesados

Prospectos únicos con interés comercial explícito.

No considerar interesado por el simple hecho de haber hablado con alguien.

## Oportunidades

Registros reales de oportunidad.

## Seguimientos

Tareas comerciales pendientes.

## Tasa de contacto

```text
contactos efectivos / visitados
```

Si no hay visitas:

```text
—
```

---

# 7. CARD HOY

Debe tener mayor jerarquía visual.

Elementos:

```text
HOY
Fecha completa
Estado: En curso
```

Ejemplo:

```text
HOY
Sábado 12 Sep
EN CURSO
```

Puede mostrar:

```text
▲ +12% vs ayer
```

solo si la comparación tiene sentido.

No abusar de indicadores positivos/negativos cuando la métrica no representa calidad.

---

# 8. SEGUNDO NIVEL — RESULTADOS DE GESTIÓN

Widget:

```text
RESULTADOS DE GESTIÓN
```

Visual recomendado:

barras horizontales.

Ejemplo:

```text
Hablé con responsable      ████████   6   43%
Hablé con recepción        █████      3   21%
Responsable no estaba      ███        2   14%
Interesado                 ██████     4   29%
Pidió cotización           ████       3   21%
Sin interés                ██         1    7%
```

El usuario debe poder cambiar:

```text
Hoy
Ayer
Semana
Personalizado
```

Cada fila debe ser clickeable.

---

# 9. ACTIVIDAD RECIENTE

Widget:

```text
ACTIVIDAD RECIENTE
```

Mostrar en timeline:

```text
hora
tipo de actividad
empresa
resultado
estado
```

Ejemplo:

```text
14:32  Llamada realizada
        Metalúrgica Sur S.A.
        Contacto efectivo

13:50  Email enviado
        Grupo Canavese
        Seguimiento

12:16  Visita realizada
        Industrias López
        Interesado
```

Agregar:

```text
Ver todas
```

---

# 10. SEGUIMIENTOS

Widget:

```text
SEGUIMIENTOS
```

Resumen:

```text
7 vencidas
5 hoy
12 próximas
```

Debajo:

```text
estado
empresa
acción
fecha
hora
```

Ejemplo:

```text
Vencida   Quevedo Canavese        Llamar a Ariel Mattos      10 Sep
Hoy       Est. Met. Oncativo      Compartir brochure         16:00
Hoy       Zuppa Hermanos           Enviar propuesta           17:30
Mañana    CLAAS Argentina         Email de seguimiento       13 Sep
```

---

# 11. EMBUDO COMERCIAL

Widget recomendado:

```text
EMBUDO COMERCIAL
```

Etapas:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
Cotizaciones
Clientes
```

V1 puede terminar en:

```text
Oportunidades
```

si todavía no existe módulo formal de cotizaciones.

Mostrar:

```text
cantidad
porcentaje
```

Ejemplo:

```text
Visitados              92  100%
Contactos efectivos    68   74%
Interesados            28   30%
Oportunidades          14   15%
```

---

# 12. DASHBOARD DIRECCIÓN

Ruta:

```text
/direction
```

Título:

```text
Dirección comercial
```

Subtítulo:

```text
Rendimiento por comerciales, zonas y giras
```

---

# 13. FILTROS DE DIRECCIÓN

Toolbar superior:

```text
Semana actual
Todos los comerciales
Todas las ciudades
Todas las giras
```

V2:

```text
Categoría
Clase
Corredor
```

---

# 14. KPIs DIRECCIÓN

Fila principal:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
Cotizaciones
Cobertura
```

Cada KPI debe mostrar:

```text
valor actual
variación vs período anterior
```

Solo usar variaciones cuando sean interpretables.

---

# 15. GRÁFICO — ACTIVIDAD POR DÍA

Tipo:

```text
line chart
```

Series:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
```

Eje X:

```text
Lun
Mar
Mié
Jue
Vie
Sáb
Dom
```

Permitir elegir:

```text
Todas las actividades
Visitas
Llamadas
Oportunidades
```

---

# 16. GRÁFICO — RENDIMIENTO POR CIUDAD / CORREDOR

Tipo:

```text
bar chart
```

Ejemplo:

```text
Oncativo       32
Oliva          27
Tío Pujio      19
Hernando       17
Río Segundo    12
```

Selector:

```text
Visitados
Contactos
Interesados
Oportunidades
```

---

# 17. TABLA — COMERCIALES

Mostrar:

```text
Comercial
Visitados
Contactos efectivos
Interesados
Oportunidades
Tasa contacto
```

Visual:

barra horizontal por fila.

No convertirlo en ranking competitivo agresivo.

Objetivo:

gestión y seguimiento.

---

# 18. EMBUDO DE CONVERSIÓN DIRECCIÓN

Mostrar:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
Cotizaciones
Clientes
```

Agregar variación:

```text
+26% en cotizaciones vs período anterior
```

solo si existe base de comparación.

---

# 19. TABLA — GIRAS RECIENTES

Columnas:

```text
Gira
Fecha
Comercial
Zona / Ciudad
Visitados
Interesados
Oportunidades
Cumplimiento
Estado
```

Estados:

```text
Planificada
En curso
Completada
Cancelada
```

---

# 20. GIRA — LÓGICA

La gira no es obligatoria para registrar actividad.

Debe servir para:

```text
planificación
agrupación
contexto
análisis
```

Debe existir:

```text
Crear gira
Crear gira retrospectiva
```

Una gira retrospectiva puede agrupar actividades existentes sin duplicarlas.

---

# 21. DASHBOARD DE GIRA

Ruta:

```text
/trips/[id]
```

KPIs:

```text
Planificados
Visitados
Contactos efectivos
Interesados
Oportunidades
Seguimientos
Cumplimiento
```

Bloques:

```text
Plan vs realidad
Resultados
Actividad
Oportunidades
Próximos pasos
```

---

# 22. PROSPECTOS — LISTADO

Ruta:

```text
/prospects
```

Objetivo:

leer una card en 1–2 segundos.

Mostrar:

```text
Empresa
Categoría · Ciudad
Clase / prioridad
Estado comercial
Última actividad
Próxima acción
```

No mostrar textos largos.

---

# 23. FILTROS PROSPECTOS

Mantener:

```text
Ciudad
Categoría
Clase
Estado
```

Agregar:

```text
Visitado hoy
Sin visitar
Con próxima acción
Sin próxima acción
Con oportunidad
Datos incompletos
```

---

# 24. FICHA DE PROSPECTO — ESTRUCTURA

Ruta:

```text
/prospects/[id]
```

Header:

```text
Empresa
Ciudad
Categoría
Prioridad
Estado comercial
```

Acciones:

```text
Llamar
WhatsApp
Maps
Registrar gestión
Más
```

---

# 25. BLOQUE — PRÓXIMA ACCIÓN

Debe aparecer arriba.

Mostrar:

```text
fecha
hora
acción
responsable
comentario
```

Botón:

```text
Marcar como realizada
```

---

# 26. BLOQUE — CONTACTO PRINCIPAL

Mostrar:

```text
nombre
cargo
teléfono
email
LinkedIn si existe
```

---

# 27. BLOQUE — ESTADO COMERCIAL

Mostrar:

```text
etapa
prioridad
origen
asignado a
fecha alta
última actividad
```

---

# 28. BLOQUE — ÚLTIMA INTERACCIÓN

Mostrar:

```text
actividad
fecha
resultado
notas
responsable
```

---

# 29. BLOQUE — RESUMEN COMERCIAL

Tres columnas:

```text
Necesidad probable
Enfoque comercial
Servicios a ofrecer
```

Este bloque resume inteligencia comercial.

No debe mezclar metadata técnica.

---

# 30. BLOQUE — ACTIVIDAD RECIENTE

Timeline vertical.

Tipos:

```text
visita
llamada
email
WhatsApp
cotización
comentario
```

---

# 31. BLOQUE — SEGUIMIENTOS ABIERTOS

Mostrar:

```text
acción
responsable
fecha
estado
```

---

# 32. BLOQUE — INFORMACIÓN DE EMPRESA

Mostrar:

```text
dirección
teléfonos
web
CUIT
Maps
```

Agregar:

```text
Calidad de datos
```

Ejemplo:

```text
80%
```

Checklist:

```text
Razón social
Teléfono
Dirección
Web
Contacto principal
Rubro
Cantidad empleados
```

---

# 33. CALIDAD DE DATOS

Estados:

```text
Incompleto
Enriquecido
Verificado
```

Score:

```text
0–100%
```

No confundir con prioridad comercial.

---

# 34. ENRIQUECIMIENTO DE PROSPECTOS

V2.

Botón:

```text
Enriquecer
```

Flujo:

```text
nombre + ciudad
→ búsqueda web
→ candidatos
→ matching AI
→ preview
→ usuario acepta
```

Campos objetivo V1:

```text
web
teléfono
dirección
lat/lng
```

V2:

```text
email
redes
rubro
descripción
persona/contacto
```

Nunca autoguardar sin preview.

---

# 35. OPORTUNIDADES

Ruta:

```text
/opportunities
```

Vista:

kanban o tabla.

Estados:

```text
Nueva
Calificada
Cotizar
Cotizada
Negociación
Ganada
Perdida
```

V1 puede simplificarse.

Campos:

```text
empresa
necesidad
valor estimado
probabilidad
responsable
próximo paso
fecha esperada
```

---

# 36. AGENDA / SEGUIMIENTOS

Ruta:

```text
/followups
```

Vistas:

```text
Hoy
Semana
Calendario
Lista
```

Mostrar:

```text
fecha
hora
empresa
tarea
responsable
estado
```

Acciones:

```text
Completar
Reprogramar
Abrir prospecto
```

---

# 37. REPORTES

V2.

Reportes sugeridos:

```text
Actividad por período
Conversión
Rendimiento por ciudad
Rendimiento por comercial
Giras
Oportunidades
Cobertura
Seguimientos vencidos
```

Exportación futura:

```text
PDF
Excel
```

---

# 38. MOBILE — PRINCIPIOS

Mobile es crítico.

Priorizar:

```text
Hoy
Próxima acción
Registrar gestión
Seguimientos
Actividad
```

No obligar a leer tablas.

Usar:

```text
cards
tabs
bottom sheets
CTA flotante
```

---

# 39. MOBILE DASHBOARD

Tabs:

```text
AYER
HOY
SEMANA
```

Default:

```text
HOY
```

Mostrar métricas en 2 columnas.

Después:

```text
Resultados
Seguimientos
Actividad
```

---

# 40. MOBILE PROSPECT

Header compacto.

CTA principal fijo:

```text
Registrar gestión
```

Acciones rápidas:

```text
Llamar
WhatsApp
Maps
```

El contenido debe apilarse:

```text
Próxima acción
Contacto
Última interacción
Resumen comercial
Seguimientos
Actividad
Datos
```

---

# 41. QUICK ACTION GLOBAL

En mobile:

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

---

# 42. ACTIVITY MODEL

Actividad responde:

```text
¿Qué hizo el comercial?
```

Tipos:

```text
visit
call
whatsapp
email
other
```

---

# 43. RESULT MODEL

Resultado responde:

```text
¿Qué pasó?
```

Ejemplos:

```text
closed
not_available
reception_only
decision_maker_contact
contact_made
interested
requested_info
requested_quote
follow_up
not_interested
invalid_data
other
```

---

# 44. COMMERCIAL STATUS

Estado responde:

```text
¿En qué etapa del negocio estamos?
```

Estados:

```text
pending
in_progress
interested
opportunity
quote
customer
discarded
```

Nunca usar:

```text
contacted
visited
```

como estados principales de pipeline.

---

# 45. VISITED / EFFECTIVE CONTACT

Son métricas derivadas.

## Visitado

```text
Hubo visita física.
```

## Contacto efectivo

```text
Hubo interacción bidireccional útil.
```

No son etapas excluyentes.

---

# 46. SCHEMA — RELACIONES

Modelo conceptual:

```text
prospects
  ├── contacts
  ├── activities
  ├── tasks
  ├── opportunities
  ├── comments
  ├── trip_stops
  └── enrichment_runs

trips
  ├── trip_stops
  └── activities
```

---

# 47. CAMPOS IMPORTANTES — PROSPECT

```text
id
name
city
category
class
priority
status
assigned_to
address
phone
website
email
lat
lng
data_status
data_completeness
last_activity_at
created_at
updated_at
```

---

# 48. CAMPOS IMPORTANTES — ACTIVITY

```text
id
prospect_id
user_id
trip_id
type
result
notes
activity_at
created_at
deleted_at
```

---

# 49. CAMPOS IMPORTANTES — TASK

```text
id
prospect_id
assigned_to
type
description
due_at
status
created_at
completed_at
```

---

# 50. CAMPOS IMPORTANTES — OPPORTUNITY

```text
id
prospect_id
owner_id
status
estimated_value
probability
next_step
expected_close
created_at
updated_at
```

---

# 51. QUERIES / ANALYTICS

Preferir:

```text
RPC
SQL views
server aggregation
```

No hacer una query por KPI.

Funciones sugeridas:

```text
get_dashboard_summary()
get_dashboard_period_detail()
get_direction_summary()
get_trip_summary()
get_prospect_overview()
```

---

# 52. TIMEZONE

Toda lógica diaria:

```text
America/Argentina/Cordoba
```

Usar:

```text
activity_at
```

para métricas comerciales.

No usar `created_at` salvo auditoría.

---

# 53. GRÁFICOS — V1

Implementar solo:

```text
Barra horizontal de resultados
Line chart actividad por día
Bar chart por ciudad/corredor
Funnel comercial
Bar ranking comerciales
```

No agregar:

```text
pie charts
donuts decorativos
heatmaps
charts 3D
```

---

# 54. V1 — ALCANCE OBLIGATORIO

Implementar:

```text
Dashboard Comercial V2
Dashboard Dirección
Prospecto V2
Listado Prospectos mejorado
Giras + dashboard de gira
Seguimientos
Oportunidades básicas
```

---

# 55. V1.5

Agregar:

```text
Calidad de datos
Enriquecimiento manual asistido
Reportes básicos
Drill-down completo
```

---

# 56. V2

Agregar:

```text
Enriquecimiento AI
Cotizaciones
Exportaciones
Automatizaciones
WhatsApp integrado
Reportes avanzados
```

---

# 57. PRINCIPIO DE DENSIDAD

La UI debe contener más información útil que la versión actual, pero sin convertirse en una tabla antigua.

Usar:

```text
cards compactas
secciones claras
tipografía jerárquica
badges discretos
iconografía consistente
```

---

# 58. PRINCIPIO DE JERARQUÍA

Siempre mostrar primero:

```text
qué pasó
qué importa
qué hacer ahora
```

Mover abajo:

```text
metadata
fuentes
evidencias
datos de importación
```

---

# 59. EMPTY STATES

Nunca mostrar grandes cajas vacías.

Usar:

```text
Sin actividad hoy.
Registrar primera gestión
```

o:

```text
Sin seguimientos pendientes.
```

compacto.

---

# 60. INTERACCIONES

Cada KPI debe permitir drill-down.

Ejemplo:

```text
Visitados 15
```

click:

```text
lista de 15 prospectos
```

Cada fila debe permitir:

```text
abrir prospecto
registrar acción
crear seguimiento
```

---

# 61. AUDITORÍA

Mantener:

```text
user
timestamp
entity
action
old_value
new_value
```

Especialmente para:

```text
status
result
opportunity
delete activity
reassign
```

---

# 62. CRITERIO VISUAL OBJETIVO

La interfaz debe verse al nivel de:

```text
software B2B moderno
CRM profesional
producto comercializable
```

No debe sentirse como:

```text
panel administrativo genérico
MVP técnico
frontend de base de datos
```

---

# 63. CRITERIOS DE ACEPTACIÓN — PRODUCTO

El sistema está bien presentado si:

- Dirección entiende el estado comercial en menos de 10 segundos.
- Comercial identifica próximas acciones en menos de 10 segundos.
- Las métricas tienen contexto temporal.
- La información importante no requiere múltiples clicks.
- Las gráficas explican algo.
- Los datos secundarios no dominan la pantalla.
- Mobile permite trabajar en campo.
- Cada KPI permite llegar al detalle.
- No existen estados ambiguos.
- La UI se siente consistente entre módulos.

---

# 64. ORDEN DE IMPLEMENTACIÓN

## Fase 1

```text
Dashboard Comercial
```

## Fase 2

```text
Prospecto V2
```

## Fase 3

```text
Dashboard Dirección
```

## Fase 4

```text
Giras
Seguimientos
```

## Fase 5

```text
Oportunidades
```

## Fase 6

```text
Calidad de datos
Enriquecimiento
```

---

# 65. ENTREGA DE ANTIGRAVITY POR FASE

Cada fase debe entregar:

```text
qué cambió
archivos modificados
migrations
queries nuevas
tests
screenshots desktop
screenshots mobile
pendientes
```

No aceptar:

```text
"implementado"
```

sin evidencia.

---

# 66. PRINCIPIO FINAL

PRESOL CRM debe evolucionar desde:

```text
base de prospectos + registro de eventos
```

hacia:

```text
plataforma de gestión comercial
```

La diferencia principal no es agregar más funciones.

La diferencia es:

```text
mejor jerarquía
mejor interpretación
mejor seguimiento
mejor decisión
```

Ese es el objetivo de este blueprint.
