# PRESOL CRM — DASHBOARD EXECUTIVE V3
## Pixel Spec + BI Layout + UX Rules for Antigravity

**Objetivo:** llevar el Dashboard actual del CRM PRESOL desde un panel funcional mínimo a una interfaz ejecutiva de nivel CRM maduro, con mayor densidad de información útil, mejor jerarquía visual, gráficos reales, estados vacíos compactos y lectura inmediata para Comercial y Dirección.

**IMPORTANTE:** no rehacer el proyecto. Reutilizar componentes, queries, layout, sidebar, autenticación, Supabase y lógica existente. Esta tarea es principalmente una **iteración de producto, BI y presentación visual**, no una migración tecnológica.

---

# 0. ESTADO ACTUAL

El Dashboard actual ya tiene:

- cards de `Ayer / Hoy / Esta semana`;
- métricas de:
  - Visitados;
  - Contactos efectivos;
  - Interesados;
  - Oportunidades;
  - Seguimientos;
  - Tasa de contacto;
- bloque de Seguimientos;
- espacio para Resultados;
- espacio para Actividad reciente;
- selector de período;
- sidebar funcional;
- estilo limpio y consistente.

Problemas actuales observados:

1. demasiado espacio vacío;
2. cards muy planas;
3. falta visualización de datos;
4. falta embudo comercial;
5. falta timeline visual;
6. resultados sin barras ni peso visual;
7. estados vacíos ocupan demasiado espacio;
8. falta mejor uso de color funcional;
9. falta comparación entre períodos;
10. falta jerarquía ejecutiva;
11. el dashboard aún se siente como “vista de datos” y no como “herramienta de gestión”.

---

# 1. OBJETIVO VISUAL

El Dashboard debe verse y sentirse como un CRM profesional, moderno y ejecutivo.

Debe transmitir:

- control;
- actividad;
- claridad;
- avance;
- prioridades;
- contexto.

Debe evitar:

- grandes zonas vacías;
- paneles blancos sin contenido;
- exceso de bordes grises;
- cards sin jerarquía;
- tablas densas sin lectura visual;
- gráficos decorativos sin valor.

---

# 2. PRINCIPIO DE DISEÑO

Cada bloque debe responder una pregunta concreta.

## Resumen temporal

```text
¿Qué pasó ayer?
¿Qué pasa hoy?
¿Cómo viene la semana?
```

## Resultados

```text
¿Qué resultado produjo la actividad?
```

## Seguimientos

```text
¿Qué hay que hacer ahora?
```

## Actividad reciente

```text
¿Qué acciones concretas se realizaron?
```

## Embudo

```text
¿Cómo estamos convirtiendo actividad en negocio?
```

---

# 3. ESTRUCTURA GENERAL DEL DASHBOARD

Usar esta composición:

```text
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ Dashboard                         [ período ] [ filtros ]     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ AYER             │ │ HOY              │ │ ESTA SEMANA      │
│ métricas         │ │ métricas         │ │ métricas         │
└──────────────────┘ └──────────────────┘ └──────────────────┘

┌──────────────────────────────┐ ┌─────────────────────────────┐
│ RESULTADOS DE GESTIÓN        │ │ ACTIVIDAD RECIENTE          │
│ barras horizontales          │ │ timeline visual             │
└──────────────────────────────┘ └─────────────────────────────┘

┌──────────────────────────────┐ ┌─────────────────────────────┐
│ SEGUIMIENTOS                 │ │ EMBUDO COMERCIAL            │
│ vencidos / hoy / próximas    │ │ funnel o barras decrecientes│
└──────────────────────────────┘ └─────────────────────────────┘
```

---

# 4. GRID DESKTOP

Usar container principal:

```css
max-width: 1440px;
margin: 0 auto;
padding: 24px 28px 40px;
```

Con sidebar actual.

## Primera fila

```css
grid-template-columns: 1fr 1.08fr 1fr;
gap: 16px;
```

## Segunda fila

```css
grid-template-columns: 1fr 1.25fr;
gap: 16px;
```

## Tercera fila

```css
grid-template-columns: 1fr 1fr;
gap: 16px;
```

No dejar columnas desbalanceadas con espacios muertos.

---

# 5. HEADER

Mantener:

```text
Dashboard
Actividad comercial en tiempo real
```

Agregar a la derecha:

```text
[ período ] [ Comercial ] [ Gira ] [ Ciudad ]
```

No mostrar todos los filtros siempre en mobile.

En desktop se puede usar toolbar compacta.

---

# 6. CARDS TEMPORALES — REDISEÑO

Las cards actuales deben mejorar visualmente.

Cada card debe tener:

- nombre del período;
- fecha;
- métricas;
- tasa de contacto;
- delta vs período anterior;
- indicador de estado;
- clickable rows.

---

# 7. CARD AYER

Header:

```text
AYER
11 SEP
```

Body:

```text
Visitados                 9
Contactos efectivos       7
Interesados               2
Oportunidades             0
Seguimientos              2
```

Footer:

```text
TASA DE CONTACTO         78%
▲ +12% vs día anterior
```

---

# 8. CARD HOY

Debe ser visualmente dominante.

Usar:

- borde azul PRESOL;
- fondo sutil azulado;
- badge `EN CURSO`;
- título azul;
- leve elevación.

Ejemplo:

```text
HOY
SÁBADO 12 SEP

● EN CURSO

Visitados                 0
Contactos efectivos       0
Interesados               0
Oportunidades             0
Seguimientos              0
```

Footer:

```text
TASA DE CONTACTO          —
```

### Regla crítica

Si no hay datos:

NO mostrar:

```text
▲ +12% vs ayer
```

Mostrar:

```text
Sin actividad todavía
```

o directamente ocultar delta.

---

# 9. CARD ESTA SEMANA

Header:

```text
ESTA SEMANA
7–13 SEP
```

Body idéntico.

Footer:

```text
TASA DE CONTACTO        77%
▲ +12% vs semana anterior
```

---

# 10. TIPOGRAFÍA DE LAS CARDS

Usar jerarquía clara.

## Label período

```css
font-size: 12px;
font-weight: 700;
letter-spacing: .12em;
text-transform: uppercase;
```

## Fecha

```css
font-size: 13px;
font-weight: 500;
color: muted;
```

## Métrica label

```css
font-size: 14px;
font-weight: 500;
```

## Métrica valor

```css
font-size: 16px;
font-weight: 700;
```

## Tasa

```css
font-size: 20px;
font-weight: 700;
```

---

# 11. RESULTADOS DE GESTIÓN

Este bloque no debe volver a ser un panel vacío.

Mostrar lista con barras horizontales.

Ejemplo:

```text
RESULTADOS DE GESTIÓN

Hablé con responsable      ████████████      6    43%
Hablé con recepción        ███████           3    21%
Responsable no estaba      █████             2    14%
Interesado                 █████████         4    29%
Pidió cotización           ███████           3    21%
Sin interés                ██                1     7%
```

---

# 12. BARRAS DE RESULTADOS

Usar colores funcionales:

```text
Responsable / contacto efectivo -> azul
Recepción -> celeste
No estaba -> amarillo
Interesado -> verde
Cotización -> violeta
Sin interés -> rojo suave
```

No usar colores saturados.

---

# 13. INTERACCIÓN DE RESULTADOS

Cada fila debe ser clickeable.

Ejemplo:

Click en:

```text
Pidió cotización 3
```

debe abrir:

```text
Prospectos con resultado "Pidió cotización"
```

---

# 14. ESTADO VACÍO DE RESULTADOS

Si hoy no hay datos:

NO mostrar un panel enorme.

Mostrar bloque compacto:

```text
RESULTADOS DE HOY

Todavía no hay resultados registrados.

[ Ver ayer ]
```

Altura máxima sugerida:

```text
140–160px
```

---

# 15. ACTIVIDAD RECIENTE — TIMELINE

Transformar en timeline visual.

Ejemplo:

```text
14:32   ●  Llamada realizada
           Metalúrgica Sur S.A.
           Contacto efectivo

13:50   ●  Email enviado
           Grupo Canavese
           Seguimiento

12:16   ●  Visita realizada
           Industrias López
           Interesado

11:03   ●  Cotización enviada
           Zuppa Hermanos
           Oportunidad
```

---

# 16. ICONOS POR ACTIVIDAD

Usar:

```text
Visita      -> usuario / edificio
Llamada     -> teléfono
WhatsApp    -> mensaje
Email       -> sobre
Cotización  -> documento
Oportunidad -> briefcase / target
```

---

# 17. BADGES EN ACTIVIDAD

Resultados como badges pequeños:

```text
Contacto efectivo
Interesado
Seguimiento
Oportunidad
Sin respuesta
```

Colores funcionales.

---

# 18. SEGUIMIENTOS

Mantener tres contadores:

```text
7 VENCIDAS
5 HOY
12 PRÓXIMAS
```

Pero mejorar visualmente.

Cada contador debe ser card interna.

---

# 19. TABLA / LISTA DE SEGUIMIENTOS

Usar formato compacto:

```text
Vencida   Quevedo Canavese              Llamar a Ariel Mattos     10 Sep
Hoy       Est. Metálicos Oncativo S.A.  Compartir brochure        16:00
Hoy       Zuppa Hermanos                 Enviar propuesta          17:30
Mañana    CLAAS Argentina               Enviar email              13 Sep
```

Columnas:

- estado;
- empresa;
- acción;
- fecha/hora.

---

# 20. EMBUDO COMERCIAL — NUEVO BLOQUE OBLIGATORIO

Agregar:

```text
EMBUDO COMERCIAL
```

Secuencia:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
Cotizaciones
Clientes
```

---

# 21. VISUAL DEL EMBUDO

Puede usar:

- funnel;
- barras decrecientes;
- stacked horizontal;
- steps.

Preferencia:

**funnel limpio**.

Ejemplo:

```text
Visitados             26    100%
Contactos efectivos   20     77%
Interesados           12     46%
Oportunidades          4     15%
Cotizaciones           2      8%
Clientes               1      4%
```

---

# 22. MÉTRICAS DEL EMBUDO

Calcular:

```text
contact_rate
interest_rate
opportunity_rate
quote_rate
customer_rate
```

---

# 23. REGLA DE SEMÁNTICA

No inferir interesado desde contacto.

No inferir oportunidad desde interesado.

No inferir cliente desde cotización.

Cada etapa debe depender de datos reales.

---

# 24. GRÁFICA DE TENDENCIA — P2 DENTRO DEL DASHBOARD

Agregar en una segunda iteración del mismo dashboard si hay datos suficientes:

```text
ACTIVIDAD POR DÍA
```

Series:

```text
Visitados
Contactos efectivos
Interesados
Oportunidades
```

Tipo:

```text
Line chart
```

Período:

```text
últimos 7 días / esta semana
```

---

# 25. NO USAR CHART SI HAY MUY POCOS DATOS

Si:

```text
< 2 días con actividad
```

ocultar chart.

Mostrar estado compacto:

```text
Todavía no hay suficiente historial para mostrar tendencia.
```

---

# 26. DASHBOARD — ESTADOS VACÍOS

Regla general:

Nunca usar paneles grandes vacíos.

Si no hay datos:

```text
No hay actividad todavía.
```

+ CTA o alternativa:

```text
Ver ayer
Registrar actividad
```

---

# 27. ALTURAS DE BLOQUES

Evitar alturas fijas innecesarias.

Preferir:

```css
min-height
```

y contenido adaptativo.

Sugerido:

```text
Temporal cards:        270–310px
Resultados:            300px
Actividad reciente:    300px
Seguimientos:          320px
Embudo:                320px
```

Solo si hay datos.

---

# 28. COLOR SYSTEM

Mantener identidad PRESOL.

## Primario

```text
Azul PRESOL
```

## Positivo

```text
Verde
```

## Atención

```text
Amarillo / ámbar
```

## Negativo / vencido

```text
Rojo suave
```

## Oportunidad

```text
Violeta
```

## Neutro

```text
Grises fríos
```

---

# 29. BORDER / SHADOW SYSTEM

No usar bordes pesados.

Cards:

```css
border: 1px solid #E7ECF3;
box-shadow: 0 2px 8px rgba(16,24,40,.05);
border-radius: 12px;
```

Hover:

```css
box-shadow: 0 6px 20px rgba(16,24,40,.08);
```

---

# 30. BACKGROUND

No blanco puro plano.

Usar background general:

```text
#F7F9FC
```

Cards:

```text
#FFFFFF
```

Hoy:

```text
azul muy pálido
```

---

# 31. ICONOS

Usar iconos solo si ayudan.

No decorar por decorar.

Recomendados:

- Calendar;
- Phone;
- Mail;
- User;
- MapPin;
- CheckCircle;
- Target;
- Briefcase;
- FileText;
- TrendingUp;
- Clock.

---

# 32. DENSIDAD

El CRM debe mostrar más información útil por viewport.

Objetivo desktop:

En una pantalla 1440p debe verse:

- 3 cards temporales;
- resultados;
- actividad reciente;
- inicio de seguimientos;
- inicio del embudo;

sin grandes zonas vacías.

---

# 33. SIDEBAR

No rehacer sidebar.

Solo considerar renombrar:

```text
Prospectos
Cotizaciones
Giras
Tareas
Oportunidades
```

Mantener coherencia.

---

# 34. MOBILE

En mobile:

```text
HOY
```

primero.

Ayer / Semana como tabs o swipe.

Orden:

```text
Hoy
Resultados
Seguimientos
Actividad reciente
Embudo
```

---

# 35. MOBILE KPIS

Evitar 6 líneas densas sin jerarquía.

Podría usarse:

```text
Visitados              8
Contacto efectivo      6
Interesados            2
Oportunidades          1
```

y seguimiento + tasa debajo.

---

# 36. CLICK / DRILL-DOWN

Todos los números relevantes deben abrir detalle.

Ejemplos:

```text
Visitados
Interesados
Oportunidades
Vencidas
Cotizaciones
```

Nada debe sentirse como dato muerto.

---

# 37. FILTROS

Mantener filtros:

```text
Período
Comercial
Gira
Ciudad
Categoría
```

Pero compactos.

No ocupar una fila enorme.

---

# 38. DASHBOARD DIRECCIÓN — PREPARAR ARQUITECTURA

No construir todo en esta fase si retrasa el dashboard principal.

Pero dejar componentes reutilizables para:

```text
Dirección
```

que luego tendrá:

- KPIs generales;
- actividad por día;
- rendimiento por ciudad;
- rendimiento por comercial;
- funnel;
- giras recientes;
- cobertura.

---

# 39. QUERY STRATEGY

No disparar una query por card.

Usar agregación.

Ideal:

```text
get_dashboard_v3_summary()
```

Retornar:

```json
{
  "yesterday": {},
  "today": {},
  "week": {},
  "results": [],
  "followups": {},
  "recent_activity": [],
  "funnel": {}
}
```

---

# 40. ACTUALIZACIÓN DE DATOS

Después de guardar:

- visita;
- llamada;
- resultado;
- tarea;
- oportunidad;
- cotización;

revalidar dashboard.

---

# 41. VALIDACIÓN LÓGICA OBLIGATORIA

Antes de dar por terminado:

verificar:

```text
HOY = 0
```

NO muestra:

```text
+12% vs ayer
```

---

# 42. SEMÁNTICA DE KPI

Verificar:

```text
Hablé con responsable
```

=> contacto efectivo

pero NO:

```text
interesado
```

salvo resultado explícito.

---

# 43. EMBUDO — REGLAS

Ejemplo correcto:

```text
Visitados = 26
Contactos efectivos = 20
Interesados = 12
Oportunidades = 4
Cotizaciones = 2
Clientes = 1
```

Nunca mostrar una etapa mayor que la anterior sin revisar datos.

Si ocurre:

mostrar warning interno en dev.

---

# 44. EMPTY STATE COMPACTO

Ejemplo:

```text
RESULTADOS DE HOY
Sin actividad todavía.

[ Ver ayer ]
```

No panel vacío de 400 px.

---

# 45. ACTIVIDAD RECIENTE — LÍMITE

Mostrar:

```text
5 a 7 items
```

y CTA:

```text
Ver todas
```

---

# 46. SEGUIMIENTOS — LÍMITE

Mostrar:

```text
5 items prioritarios
```

y CTA:

```text
Ver todos
```

---

# 47. EMBUDO — PERÍODO

Default:

```text
Esta semana
```

Selector:

```text
Hoy
Semana
Mes
Personalizado
```

---

# 48. RESULTADOS — PERÍODO

Default:

```text
Hoy
```

pero selector pequeño:

```text
Hoy
Ayer
Semana
```

---

# 49. COMPARACIONES

Mostrar comparaciones solo si existen datos de ambos períodos.

Ejemplo:

```text
+12% vs ayer
```

solo si:

```text
today > 0
yesterday > 0
```

o si semánticamente corresponde.

No mostrar porcentaje absurdo cuando base anterior = 0.

---

# 50. REGLA DE DELTA

Si base anterior = 0:

mostrar:

```text
Nuevo
```

NO:

```text
+∞%
```

---

# 51. WIREFRAME FINAL DESKTOP

```text
DASHBOARD
Actividad comercial en tiempo real

[ período ] [ comercial ] [ gira ] [ ciudad ]

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ AYER            │ │ HOY             │ │ ESTA SEMANA     │
│ métricas        │ │ métricas        │ │ métricas        │
│ tasa + delta    │ │ tasa + delta    │ │ tasa + delta    │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌───────────────────────────────┐ ┌───────────────────────────────┐
│ RESULTADOS DE GESTIÓN         │ │ ACTIVIDAD RECIENTE            │
│ barras                         │ │ timeline                       │
└───────────────────────────────┘ └───────────────────────────────┘

┌───────────────────────────────┐ ┌───────────────────────────────┐
│ SEGUIMIENTOS                  │ │ EMBUDO COMERCIAL              │
│ contadores + lista            │ │ funnel + tasas                │
└───────────────────────────────┘ └───────────────────────────────┘
```

---

# 52. TESTS VISUALES

Capturar desktop:

```text
1440x900
1920x1080
```

Capturar mobile:

```text
390x844
430x932
```

Comparar contra mockup objetivo.

---

# 53. TESTS FUNCIONALES

## Test 1

Registrar visita con:

```text
Hablé con responsable
```

Esperado:

```text
Visitados +1
Contactos efectivos +1
Interesados +0
```

## Test 2

Registrar:

```text
Interesado
```

Esperado:

```text
Interesados +1
```

## Test 3

Registrar oportunidad.

Esperado:

```text
Oportunidades +1
```

## Test 4

Registrar tarea vencida.

Esperado:

```text
Seguimientos > vencidas +1
```

## Test 5

HOY sin actividad.

Esperado:

```text
Sin actividad todavía
```

sin delta inválido.

---

# 54. CRITERIOS DE ACEPTACIÓN VISUAL

- [ ] No hay grandes zonas vacías.
- [ ] Las cards temporales tienen mayor jerarquía.
- [ ] HOY se distingue claramente.
- [ ] Resultados usan barras.
- [ ] Actividad reciente usa timeline.
- [ ] Seguimientos son compactos.
- [ ] Embudo comercial existe.
- [ ] Colores tienen significado.
- [ ] Hay iconografía funcional.
- [ ] Layout desktop se siente denso pero limpio.
- [ ] Mobile prioriza HOY.
- [ ] Empty states son compactos.
- [ ] No hay porcentajes inválidos.
- [ ] Todos los KPIs relevantes permiten drill-down.

---

# 55. CRITERIOS DE ACEPTACIÓN DE PRODUCTO

Dirección debe poder responder en menos de 10 segundos:

```text
¿Cuántas empresas visitamos?
¿Cuántas fueron contacto efectivo?
¿Cuántas mostraron interés?
¿Cuántas oportunidades generamos?
¿Qué tenemos vencido?
¿Qué se hizo hoy?
¿Cómo viene la semana?
```

El Comercial debe poder responder:

```text
¿Qué tengo que hacer ahora?
¿Qué actividad hice hoy?
¿Qué prospectos requieren seguimiento?
```

---

# 56. FASE 2 — DASHBOARD DIRECCIÓN

Una vez que este dashboard esté aprobado:

crear `/direction` o reutilizar módulo Dirección.

Contenido:

```text
KPIs generales
Actividad por día
Rendimiento por ciudad/corredor
Rendimiento por comercial
Embudo de conversión
Giras recientes
Cobertura
```

No mezclar todo eso ahora en el dashboard principal.

---

# 57. ORDEN EXACTO DE IMPLEMENTACIÓN

1. Corregir deltas inválidos.
2. Ajustar cards temporales.
3. Reducir espacios vacíos.
4. Implementar Resultados con barras.
5. Implementar Actividad reciente como timeline.
6. Rediseñar Seguimientos.
7. Implementar Embudo comercial.
8. Agregar drill-down.
9. Ajustar responsive.
10. Probar con datos reales.
11. Capturar screenshots.
12. Comparar visualmente contra mockup objetivo.

---

# 58. INSTRUCCIÓN FINAL PARA ANTIGRAVITY

No considerar esta tarea terminada cuando:

```text
“los componentes existen”
```

Considerarla terminada cuando:

```text
la pantalla se ve y se comporta como un dashboard ejecutivo completo
```

El objetivo es reducir claramente la distancia entre la implementación actual y el mockup aprobado.

No agregar nuevas funcionalidades ajenas a este alcance hasta cerrar esta iteración visual y funcional.
