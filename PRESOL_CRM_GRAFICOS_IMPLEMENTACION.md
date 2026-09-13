# PRESOL CRM — IMPLEMENTACIÓN OBLIGATORIA DE GRÁFICOS
## Especificación complementaria para Antigravity

**Objetivo:** implementar los gráficos que faltan en PRESOL CRM y convertir los dashboards Comercial y Dirección en herramientas visuales de análisis, no solo en conjuntos de cards y tablas.

Esta especificación complementa `PRESOL_CRM_UI_UX_MASTER_BLUEPRINT.md`.

Los gráficos definidos aquí son **obligatorios** para considerar completa la implementación visual.

---

# 1. PRINCIPIO GENERAL

Los gráficos deben responder preguntas de gestión.

No agregar charts decorativos.

Cada gráfico debe:
- tener título claro;
- usar datos reales;
- respetar filtros de período;
- permitir drill-down cuando sea razonable;
- mostrar tooltip;
- funcionar en desktop y mobile;
- usar la misma lógica de métricas del CRM;
- actualizarse al registrar nueva actividad;
- no duplicar información sin aportar lectura.

---

# 2. LIBRERÍA

Antes de instalar nada:
1. inspeccionar dependencias actuales;
2. verificar si ya existe Recharts;
3. verificar si shadcn/ui charts ya está disponible;
4. reutilizar la librería existente.

Si no existe librería de charts:

```text
preferir Recharts
```

No introducir una segunda librería innecesaria.

---

# 3. DASHBOARD COMERCIAL — GRÁFICOS OBLIGATORIOS

Ruta:

```text
/dashboard
```

Implementar obligatoriamente:
1. Barras horizontales de Resultados de Gestión.
2. Embudo Comercial.

---

# 4. GRÁFICO 1 — RESULTADOS DE GESTIÓN

## Tipo

```text
Horizontal Bar Chart
```

## Ubicación

Debajo de:

```text
AYER | HOY | ESTA SEMANA
```

En desktop:

```text
Resultados de gestión | Actividad reciente
```

## Datos

Contar activities por `result`.

Ejemplo:

```text
Hablé con responsable      6
Hablé con recepción        3
Responsable no estaba      2
Interesado                 4
Pidió cotización           3
Sin interés                1
```

## Visual

Cada fila:

```text
Label
barra
cantidad
porcentaje
```

Ejemplo:

```text
Hablé con responsable   ████████████   6   43%
Hablé con recepción     ██████         3   21%
Responsable no estaba   ████           2   14%
Interesado              ████████       4   29%
Pidió cotización        ██████         3   21%
Sin interés             ██             1    7%
```

## Filtro

Selector:

```text
Hoy
Ayer
Esta semana
Personalizado
```

Default:

```text
Hoy
```

## Drill-down

Click en una barra:

```text
abrir prospectos asociados
```

---

# 5. GRÁFICO 2 — EMBUDO COMERCIAL

## Tipo

```text
Funnel Chart
```

## Etapas V1

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
```

Si ya existe cotización formal:

```text
Cotizaciones
```

Si ya existe cliente:

```text
Clientes
```

## Ejemplo

```text
Visitados              92  100%
Contactos efectivos    68   74%
Interesados            28   30%
Oportunidades          14   15%
```

## Cálculo

`Visitados`:

```sql
COUNT(DISTINCT prospect_id)
WHERE activity.type = 'visit'
```

`Contactos efectivos`:
prospectos únicos con resultado efectivo.

`Interesados`:
prospectos únicos con interés explícito.

`Oportunidades`:
oportunidades reales creadas.

## Importante

No usar:

```text
Contactado
Visitado
Interesado
```

como enum secuencial del prospecto.

El funnel se construye con métricas derivadas.

---

# 6. DASHBOARD DIRECCIÓN — GRÁFICOS OBLIGATORIOS

Ruta:

```text
/direction
```

Implementar obligatoriamente:
1. Line chart — Actividad por día.
2. Bar chart — Rendimiento por ciudad/corredor.
3. Funnel — Embudo de conversión.
4. Ranking visual de comerciales.

---

# 7. GRÁFICO 3 — ACTIVIDAD POR DÍA

## Tipo

```text
Line Chart
```

## Pregunta

```text
¿Cómo evolucionó la actividad comercial durante la semana?
```

## Eje X

```text
Lunes
Martes
Miércoles
Jueves
Viernes
Sábado
Domingo
```

## Series

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
```

## Filtros

```text
Semana actual
Semana anterior
Personalizado
```

Opcional:

```text
Todos los comerciales
```

## Tooltip

Ejemplo:

```text
Miércoles 10 Sep

Visitados: 18
Contactos efectivos: 14
Interesados: 6
Oportunidades: 3
```

---

# 8. GRÁFICO 4 — RENDIMIENTO POR CIUDAD / CORREDOR

## Tipo

```text
Vertical Bar Chart
```

## Pregunta

```text
¿En qué zonas estamos teniendo mayor actividad o mejores resultados?
```

## Selector

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
```

Default:

```text
Visitados
```

## Eje X

Ciudades o corredores.

Ejemplo:

```text
Oncativo
Oliva
Tío Pujio
Hernando
Río Segundo
```

## Orden

Descendente por valor.

## Drill-down

Click en barra:

```text
abrir prospectos filtrados por ciudad/corredor
```

---

# 9. GRÁFICO 5 — EMBUDO DE CONVERSIÓN DIRECCIÓN

## Tipo

```text
Funnel Chart
```

## Etapas

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
Cotizaciones
Clientes
```

Mostrar solo etapas disponibles.

## Métricas

Para cada nivel:

```text
cantidad
% sobre visitados
% vs etapa anterior (opcional)
```

## Comparación

Debajo puede mostrarse:

```text
+26% en cotizaciones vs semana anterior
```

solo cuando exista comparación válida.

---

# 10. GRÁFICO 6 — COMERCIALES

## Tipo

Usar:

```text
tabla + barras horizontales
```

## Filas

```text
Comercial
Visitados
Contactos efectivos
Interesados
Oportunidades
```

## Selector

```text
Visitados
Contactos
Interesados
Oportunidades
```

---

# 11. DASHBOARD DE GIRA

Ruta:

```text
/trips/[id]
```

Implementar:
1. barras de resultados;
2. mini funnel de gira;
3. plan vs realizado.

## Plan vs realizado

Mostrar:

```text
Planificados
Visitados
No visitados
No planificados visitados
```

Puede ser:

```text
stacked bar
```

o barra de progreso.

No usar pie chart.

---

# 12. COLORES

Mantener consistencia global.

Asignación recomendada:

```text
Visitados              azul
Contactos efectivos    verde
Interesados            amarillo / ámbar
Oportunidades          violeta
Cotizaciones           púrpura
Clientes               verde fuerte
Sin interés            rojo suave
No estaba              gris / amarillo
```

Usar tokens del design system.

No hardcodear colores diferentes por componente.

---

# 13. TOOLTIP Y LEYENDAS

Todos los charts deben tener tooltip.

Mostrar:

```text
label
valor
porcentaje si corresponde
```

No mostrar keys técnicas como:

```text
effective_contacts
```

Las leyendas deben ser compactas y consistentes.

---

# 14. EMPTY STATES

Si no existen datos:

NO mostrar gráfico vacío.

Mostrar:

```text
Sin datos suficientes para este período.
```

CTA opcional:

```text
Cambiar período
```

---

# 15. MOBILE

## Line chart

Mostrar 7 días visibles.

## Bar chart ciudad

Mostrar Top 5 y:

```text
Ver todas
```

## Funnel

Si pierde legibilidad, convertir en lista escalonada:

```text
Visitados              92  100%
████████████████████

Contactos efectivos    68   74%
███████████████

Interesados            28   30%
██████

Oportunidades          14   15%
███
```

---

# 16. QUERIES

No calcular charts con múltiples queries client-side.

Crear agregaciones server-side.

Funciones sugeridas:

```text
get_activity_trend()
get_results_breakdown()
get_conversion_funnel()
get_city_performance()
get_salesperson_performance()
```

---

# 17. ESTRUCTURA DE DATOS — ACTIVIDAD POR DÍA

Ejemplo:

```json
[
  {
    "date": "2026-09-07",
    "visited": 12,
    "effective_contacts": 8,
    "interested": 3,
    "opportunities": 1
  },
  {
    "date": "2026-09-08",
    "visited": 15,
    "effective_contacts": 10,
    "interested": 4,
    "opportunities": 2
  }
]
```

---

# 18. ESTRUCTURA — RESULTADOS

```json
[
  {
    "result": "decision_maker_contact",
    "label": "Hablé con responsable",
    "count": 6
  },
  {
    "result": "reception_only",
    "label": "Hablé con recepción",
    "count": 3
  }
]
```

---

# 19. ESTRUCTURA — FUNNEL

```json
{
  "visited": 92,
  "effective_contacts": 68,
  "interested": 28,
  "opportunities": 14,
  "quotes": 0,
  "customers": 0
}
```

---

# 20. ESTRUCTURA — CIUDADES

```json
[
  {
    "city": "Oncativo",
    "visited": 32,
    "effective_contacts": 24,
    "interested": 9,
    "opportunities": 4
  }
]
```

---

# 21. FILTROS

Todos los charts de Dirección deben reaccionar a:

```text
Período
Comercial
Ciudad
Gira
```

Cuando cambia un filtro:

```text
KPIs
charts
tables
```

deben actualizarse juntos.

---

# 22. INTERACCIÓN

Click en:

```text
barra ciudad
punto line chart
segmento funnel
resultado
```

debe permitir llegar al detalle.

Puede navegar a:

```text
/prospects?...filters
```

---

# 23. LAYOUT DESKTOP — DASHBOARD COMERCIAL

```text
AYER | HOY | ESTA SEMANA

RESULTADOS DE GESTIÓN     ACTIVIDAD RECIENTE

SEGUIMIENTOS              EMBUDO COMERCIAL
```

---

# 24. LAYOUT DESKTOP — DIRECCIÓN

```text
KPIs

ACTIVIDAD POR DÍA        RENDIMIENTO POR CIUDAD

COMERCIALES              EMBUDO DE CONVERSIÓN

GIRAS RECIENTES
```

---

# 25. COMPONENTES SUGERIDOS

```text
components/charts/
  ResultsBarChart.tsx
  ActivityTrendChart.tsx
  CityPerformanceChart.tsx
  ConversionFunnel.tsx
  SalespersonRanking.tsx
  TripPlanVsActual.tsx
```

---

# 26. FUNCIONES DE DATOS

```text
lib/analytics/
  dashboard.ts
  direction.ts
  funnel.ts
  results.ts
  cities.ts
  salespeople.ts
```

---

# 27. TESTS OBLIGATORIOS

## Test 1

Registrar visita.

Debe actualizar:

```text
card Visitados
line chart
funnel
```

## Test 2

Registrar:

```text
Interesado
```

Debe actualizar:

```text
Resultados
Interesados
Funnel
```

## Test 3

Crear oportunidad.

Debe actualizar:

```text
Oportunidades
Funnel
```

## Test 4

Cambiar filtro de ciudad.

Debe actualizar:

```text
KPIs
line chart
bar city
funnel
tabla comerciales
```

## Test 5

Sin datos.

Debe mostrar empty state.

---

# 28. CRITERIOS DE ACEPTACIÓN

La fase se considera terminada cuando:

- [ ] Dashboard Comercial tiene Resultados de Gestión en barras.
- [ ] Dashboard Comercial tiene Embudo Comercial.
- [ ] Dirección tiene line chart de actividad.
- [ ] Dirección tiene bar chart por ciudad/corredor.
- [ ] Dirección tiene embudo de conversión.
- [ ] Dirección tiene ranking visual de comerciales.
- [ ] Dashboard de gira tiene visualización plan vs realizado.
- [ ] Charts usan datos reales.
- [ ] Charts reaccionan a filtros.
- [ ] Tooltips funcionan.
- [ ] Drill-down funciona.
- [ ] Mobile es legible.
- [ ] No existen gráficos decorativos.
- [ ] No hay placeholders.
- [ ] No hay datos hardcodeados.
- [ ] La semántica de Visitados / Contactos efectivos / Interesados es la definida por el CRM.

---

# 29. ORDEN DE IMPLEMENTACIÓN

1. Auditar datos disponibles.
2. Crear queries agregadas.
3. Implementar ResultsBarChart.
4. Implementar ConversionFunnel.
5. Implementar ActivityTrendChart.
6. Implementar CityPerformanceChart.
7. Implementar SalespersonRanking.
8. Implementar TripPlanVsActual.
9. Conectar filtros.
10. Agregar drill-down.
11. Ajustar mobile.
12. Testear con datos reales.
13. Entregar capturas desktop/mobile.

---

# 30. INSTRUCCIÓN FINAL

No considerar completa la implementación visual del CRM si solo existen:

```text
cards
listas
tablas
```

El objetivo es incorporar visualizaciones que ayuden a interpretar:

```text
tendencia
conversión
distribución
rendimiento
```

Los gráficos aquí definidos son parte obligatoria de la experiencia V1 del CRM.
