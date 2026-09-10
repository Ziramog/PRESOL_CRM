# PRESOL CRM — DASHBOARD V2 / DIRECCIONES PARA ANTIGRAVITY

## Objetivo

Rediseñar el Dashboard actual del CRM PRESOL para convertirlo en una herramienta de gestión comercial diaria, con lectura inmediata para Comercial y Dirección.

La nueva vista debe responder rápidamente:

- ¿Qué pasó ayer?
- ¿Qué está pasando hoy?
- ¿Cómo viene la semana?
- ¿Cuántos prospectos se visitaron?
- ¿Cuántos tuvieron contacto efectivo?
- ¿Cuántos mostraron interés?
- ¿Cuántas oportunidades surgieron?
- ¿Qué seguimientos están pendientes?
- ¿Qué resultados concretos tuvieron las visitas?

No rehacer el proyecto ni reemplazar componentes que ya funcionan. Reutilizar layout, navegación, Supabase, queries y design system actual.

---

# 1. PRINCIPIO DE PRODUCTO

El Dashboard no debe mostrar KPIs aislados sin contexto temporal.

La lectura principal debe ser:

```text
AYER
HOY
ESTA SEMANA
```

Las tres vistas deben estar siempre visibles como resumen ejecutivo.

---

# 2. REEMPLAZAR EL BLOQUE SUPERIOR ACTUAL

Actualmente existen cards independientes como:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
Atrasadas
Tareas hoy
```

Reemplazarlas visualmente por tres cards principales:

```text
AYER | HOY | ESTA SEMANA
```

Cada card debe contener las mismas métricas:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
Seguimientos
Tasa de contacto efectivo
```

Ejemplo:

```text
AYER
09 SEP

Visitados                 15
Contactos efectivos       11
Interesados                9
Oportunidades              0
Seguimientos               3

Contacto efectivo         73%
```

```text
HOY
10 SEP

Visitados                  8
Contactos efectivos        6
Interesados                2
Oportunidades              1
Seguimientos               3

Contacto efectivo         75%
```

```text
ESTA SEMANA
07–10 SEP

Visitados                 31
Contactos efectivos       23
Interesados                8
Oportunidades              4
Seguimientos              11

Contacto efectivo         74%
```

---

# 3. JERARQUÍA VISUAL

La card `HOY` debe ser la principal.

En desktop:

```text
AYER | HOY | ESTA SEMANA
```

en una sola fila.

Proporción sugerida:

```text
1fr 1.1fr 1fr
```

La card HOY puede tener borde o fondo ligeramente más destacado.

No usar colores excesivos.

---

# 4. DEFINICIONES EXACTAS

## Visitados

Prospectos únicos con:

```text
activity.type = visit
```

dentro del período.

Usar:

```sql
COUNT(DISTINCT prospect_id)
```

No contar cantidad de eventos.

## Contactos efectivos

Prospectos únicos con interacción bidireccional real.

Resultados efectivos sugeridos:

```text
reception_only
decision_maker_contact
contact_made
interested
requested_info
requested_quote
follow_up
not_interested
```

Excluir:

```text
no_answer
closed
not_available
invalid_data
```

## Interesados

Prospectos únicos con interés comercial explícito.

No considerar automáticamente interesado a:

```text
reception_only
decision_maker_contact
contact_made
follow_up
```

Hablar con alguien no significa interés.

## Oportunidades

Cantidad de oportunidades reales creadas en el período.

No crear oportunidad automáticamente solo porque alguien pidió información.

## Seguimientos

Tareas comerciales pendientes asociadas al período o al usuario/contexto actual.

## Tasa de contacto efectivo

```text
contactos_efectivos / visitados
```

Si visitados = 0:

```text
—
```

---

# 5. DEFINICIÓN DE PERÍODOS

Timezone obligatorio:

```text
America/Argentina/Cordoba
```

## Ayer

Día calendario anterior completo.

## Hoy

Desde 00:00 hasta el momento actual.

## Esta semana

Desde lunes 00:00 hasta el momento actual.

NO usar últimos 7 días.

Usar `activity_at` como fecha comercial si existe.

No usar `created_at` para métricas comerciales salvo que no exista alternativa.

---

# 6. CARDS INTERACTIVAS

Cada métrica debe permitir drill-down.

Ejemplos:

```text
HOY > Visitados 15
```

abre listado de prospectos visitados hoy.

```text
HOY > Interesados 9
```

abre prospectos interesados hoy.

```text
ESTA SEMANA > Oportunidades 4
```

abre oportunidades de la semana.

Puede implementarse mediante:

- drawer;
- modal;
- página filtrada;
- reutilización de `/prospects`.

Elegir la opción más consistente con la arquitectura actual.

---

# 7. SACAR EL CALENDARIO COMO ELEMENTO PRINCIPAL

Actualmente el calendario ocupa demasiado espacio.

No debe estar permanentemente visible.

Moverlo a:

```text
Día específico
Personalizado
```

El calendario aparece solo cuando se selecciona uno de esos modos.

Mantener un selector compacto:

```text
HOY
AYER
ESTA SEMANA
DÍA ESPECÍFICO
PERSONALIZADO
```

Las tres cards ejecutivas Ayer/Hoy/Semana siguen visibles.

---

# 8. SEGUNDO NIVEL DEL DASHBOARD

Debajo de las tres cards mostrar dos bloques:

```text
RESULTADOS DEL PERÍODO
SEGUIMIENTOS
```

Default:

```text
período = HOY
```

---

# 9. RESULTADOS DEL PERÍODO

Ejemplo:

```text
RESULTADOS DE HOY

Hablé con responsable        4
Hablé con recepción          3
Responsable no estaba        2
Pidió cotización             2
Interesado                   2
Sin interés                  1
```

Usar lista y/o barras horizontales simples.

No agregar charts complejos.

Cada resultado debe ser clickeable y mostrar los prospectos correspondientes.

---

# 10. SEGUIMIENTOS

Reemplazar visualmente las cards aisladas:

```text
Atrasadas
Tareas hoy
```

por un bloque consolidado:

```text
SEGUIMIENTOS

Vencidos       2
Para hoy       3
Próximos       7
```

Debajo mostrar las próximas acciones prioritarias:

```text
09:00 — Empresa A — llamar responsable
11:30 — Empresa B — enviar presentación
15:00 — Empresa C — revisar cotización
```

---

# 11. ACTIVIDAD RECIENTE

Agregar debajo:

```text
ACTIVIDAD RECIENTE
```

Ejemplo:

```text
10:42
Visita · Empresa A
Hablé con responsable · Interesado

10:05
Visita · Empresa B
Responsable no estaba

09:21
Llamada · Empresa C
Pidió información
```

Mostrar:

- hora;
- empresa;
- actividad;
- resultado;
- comercial.

---

# 12. FILTROS DE ANÁLISIS

Mantener:

```text
Comercial
Gira
Ciudad
Categoría
Fecha / período
```

Pero no deben dominar la home.

Ubicarlos en una toolbar compacta o sección:

```text
Analizar
```

---

# 13. VISTA COMERCIAL VS DIRECCIÓN

## Comercial

Priorizar:

```text
Hoy
Seguimientos
Actividad reciente
Mis oportunidades
```

## Dirección

Priorizar:

```text
Ayer / Hoy / Esta semana
Comparación entre comerciales
Resultados
Oportunidades
Cobertura
Seguimientos vencidos
```

No duplicar componentes innecesariamente.

---

# 14. AUDITAR EL KPI "INTERESADOS"

Antes de cerrar esta implementación, revisar la lógica actual.

Si hoy aparecen números del tipo:

```text
Visitados             15
Contactos efectivos   11
Interesados            9
```

verificar que `Interesado` no se esté activando por una simple conversación.

Ejemplo correcto:

```text
Visita
Resultado: Hablé con responsable
```

produce:

```text
Visitado = sí
Contacto efectivo = sí
Interesado = no
```

Ejemplo:

```text
Visita
Resultado: Interesado
```

produce:

```text
Visitado = sí
Contacto efectivo = sí
Interesado = sí
```

Ejemplo:

```text
Visita
Resultado: Pidió cotización
```

produce:

```text
Visitado = sí
Contacto efectivo = sí
Interesado = sí
```

La oportunidad debe contarse solo si existe una oportunidad real.

---

# 15. MOBILE

Priorizar mobile.

No mostrar obligatoriamente tres cards grandes apiladas.

Preferir:

```text
[ AYER ] [ HOY ] [ SEMANA ]
```

con HOY seleccionado por defecto,

o carrusel horizontal limpio.

El detalle de métricas debe ser legible sin zoom.

---

# 16. EMPTY STATES

Eliminar grandes cajas vacías.

No mostrar paneles altos con:

```text
No hay actividades recientes.
```

Usar bloques compactos.

Ejemplo:

```text
Todavía no hay actividad comercial hoy.
```

CTA opcional:

```text
Registrar actividad
```

---

# 17. EVITAR ESPACIO MUERTO

La altura de los paneles debe adaptarse al contenido.

No crear contenedores de 300–400 px para mostrar un único mensaje.

---

# 18. WIREFRAME DESKTOP

```text
Dashboard
Actividad comercial

┌─────────────────┐ ┌───────────────────┐ ┌─────────────────┐
│ AYER            │ │ HOY               │ │ ESTA SEMANA     │
│ 09 SEP          │ │ 10 SEP            │ │ 07–10 SEP       │
│                 │ │                   │ │                 │
│ Visitados    15 │ │ Visitados      8  │ │ Visitados    31 │
│ Contactos    11 │ │ Contactos      6  │ │ Contactos    23 │
│ Interesados   9 │ │ Interesados    2  │ │ Interesados   8 │
│ Oportunid.    0 │ │ Oportunid.     1  │ │ Oportunid.    4 │
│ Seguim.       3 │ │ Seguim.        3  │ │ Seguim.      11 │
│                 │ │                   │ │                 │
│ Contacto     73%│ │ Contacto      75% │ │ Contacto     74%│
└─────────────────┘ └───────────────────┘ └─────────────────┘


┌────────────────────────────┐ ┌────────────────────────────┐
│ RESULTADOS DE HOY          │ │ SEGUIMIENTOS               │
│                            │ │                            │
│ Responsable           4    │ │ Vencidos              2   │
│ Recepción             3    │ │ Para hoy              3   │
│ No estaba             2    │ │ Próximos              7   │
│ Cotización            2    │ │                            │
│ Interesado            2    │ │ 09:00 Empresa A            │
└────────────────────────────┘ └────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│ ACTIVIDAD RECIENTE                                          │
│                                                             │
│ 10:42 · Empresa A · Visita · Interesado                     │
│ 10:05 · Empresa B · Visita · Responsable no estaba          │
│ 09:21 · Empresa C · Llamada · Pidió información             │
└─────────────────────────────────────────────────────────────┘

[ Analizar otro período / gira / comercial / ciudad ]
```

---

# 19. QUERIES

Evitar una query por número.

No hacer:

```text
6 métricas x 3 períodos = 18 queries
```

Preferir una función agregada server-side, RPC o view equivalente a:

```text
get_dashboard_summary()
```

Debe devolver:

```json
{
  "yesterday": {
    "visited": 0,
    "effective_contacts": 0,
    "interested": 0,
    "opportunities": 0,
    "followups": 0,
    "contact_rate": 0
  },
  "today": {},
  "week": {}
}
```

Crear una segunda query para:

```text
results
followups
recent_activity
```

del período seleccionado.

---

# 20. ACTUALIZACIÓN

Después de:

- registrar visita;
- registrar llamada;
- modificar resultado;
- crear tarea;
- crear oportunidad;

el dashboard debe refrescar/revalidar automáticamente.

No requerir reload manual.

---

# 21. NO CAMBIAR

No modificar por esta tarea:

- sidebar;
- branding PRESOL;
- autenticación;
- Supabase;
- contactos;
- oportunidades;
- planificador de giras;
- lógica general de la PWA;
- estructura principal del proyecto.

Solo cambiar lo necesario para mejorar el dashboard y sus métricas.

---

# 22. TESTS MÍNIMOS

## Test A

Registrar una visita con:

```text
Resultado = Hablé con responsable
```

Esperado:

```text
Visitados +1
Contactos efectivos +1
Interesados +0
```

## Test B

Registrar visita con:

```text
Resultado = Interesado
```

Esperado:

```text
Visitados +1
Contactos efectivos +1
Interesados +1
```

## Test C

Registrar visita:

```text
Resultado = Cerrado
```

Esperado:

```text
Visitados +1
Contactos efectivos +0
Interesados +0
```

## Test D

Una empresa con dos actividades el mismo día.

Esperado:

```text
Visitados únicos = 1
```

si ambas actividades pertenecen al mismo prospecto.

## Test E

Click en:

```text
HOY > Visitados
```

debe mostrar exactamente los prospectos visitados hoy.

## Test F

Click en:

```text
ESTA SEMANA > Interesados
```

debe mostrar interesados únicos desde el lunes hasta hoy.

## Test G

Seleccionar:

```text
Día específico
```

debe desplegar calendario.

---

# 23. CRITERIOS DE ACEPTACIÓN

La tarea se considera terminada cuando:

- [ ] Hay tres cards principales: Ayer / Hoy / Esta semana.
- [ ] Hoy tiene mayor jerarquía visual.
- [ ] Las tres cards muestran las mismas métricas.
- [ ] Esta semana empieza el lunes.
- [ ] Timezone Argentina está aplicado.
- [ ] Visitados cuenta prospectos únicos.
- [ ] Contactos efectivos cuenta prospectos únicos.
- [ ] Interesados solo refleja interés explícito.
- [ ] Oportunidades refleja oportunidades reales.
- [ ] Seguimientos reemplaza visualmente Atrasadas/Tareas Hoy.
- [ ] Existe bloque Resultados.
- [ ] Existe bloque Actividad reciente.
- [ ] Calendario no ocupa espacio permanente.
- [ ] Cada KPI tiene drill-down.
- [ ] No hay grandes paneles vacíos.
- [ ] Mobile funciona correctamente.
- [ ] Desktop muestra las tres cards en una fila.
- [ ] Dashboard se actualiza después de registrar actividad.
- [ ] No se rompe ninguna funcionalidad existente.

---

# 24. ORDEN DE IMPLEMENTACIÓN

1. Auditar queries actuales del dashboard.
2. Verificar semántica de Visitados, Contactos efectivos e Interesados.
3. Corregir cualquier conteo incorrecto.
4. Crear agregación Ayer / Hoy / Semana.
5. Construir las tres cards.
6. Mover calendario a Día específico / Personalizado.
7. Construir Resultados.
8. Construir Seguimientos.
9. Construir Actividad reciente.
10. Agregar drill-down.
11. Ajustar mobile.
12. Probar con datos reales existentes.
13. Entregar resumen de cambios y tests realizados.

---

# 25. REGLA FINAL

El Dashboard PRESOL debe responder visualmente:

```text
AYER
¿Qué hicimos?
```

```text
HOY
¿Qué estamos haciendo?
```

```text
ESTA SEMANA
¿Cómo venimos?
```

Y después:

```text
¿Qué resultados obtuvimos?
¿Qué tenemos que hacer ahora?
```

Ese debe ser el orden de lectura y la jerarquía del producto.
