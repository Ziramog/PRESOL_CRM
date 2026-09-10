# PRESOL CRM — CORRECCIÓN DE MODELO: VISITADO, CONTACTADO, ACTIVIDAD Y ESTADO COMERCIAL

**Objetivo:** corregir la lógica conceptual y técnica del CRM para evitar confundir:
- el canal o tipo de actividad realizada;
- el resultado de esa actividad;
- el estado comercial actual del prospecto.

Esta corrección debe aplicarse antes de seguir ampliando dashboards o analytics, porque de lo contrario las métricas serán ambiguas.

---

# 1. PROBLEMA ACTUAL

Actualmente existe una confusión entre conceptos como:

- Visitado
- Contactado
- Resultado de una actividad
- Estado comercial

Ejemplo del problema:

Si un comercial visita físicamente una empresa y habla con alguien, el sistema podría marcar al prospecto como:

```text
Visitado
Contactado
```

Esto es ambiguo.

En PRESOL necesitamos que cada concepto tenga un significado claro.

---

# 2. PRINCIPIO CENTRAL

Separar completamente tres dimensiones:

```text
ACTIVIDAD
RESULTADO
ESTADO COMERCIAL
```

Cada una responde una pregunta diferente.

---

# 3. ACTIVIDAD = QUÉ HIZO EL COMERCIAL

La actividad representa el canal o acción realizada.

Valores recomendados:

```text
visit
call
whatsapp
email
other
```

Labels:

```text
Visita
Llamada
WhatsApp
Email
Otra
```

Ejemplos:

```text
Fui físicamente a la empresa
=> activity.type = visit

Llamé por teléfono
=> activity.type = call

Mandé WhatsApp
=> activity.type = whatsapp

Mandé email
=> activity.type = email
```

---

# 4. "VISITADO" NO ES "CONTACTADO"

Una visita representa presencia física.

Por lo tanto:

```text
activity.type = visit
```

significa:

```text
La empresa fue visitada físicamente.
```

NO debe convertir automáticamente al prospecto en:

```text
Contactado
```

---

# 5. ELIMINAR "CONTACTADO" COMO ESTADO COMERCIAL AUTOMÁTICO

No utilizar:

```text
contacted
```

como estado comercial derivado automáticamente.

Razón:

"Contactado" puede interpretarse como:

- llamada atendida;
- WhatsApp respondido;
- email respondido;
- conversación presencial.

Es demasiado ambiguo como estado de pipeline.

---

# 6. ESTADO COMERCIAL = EN QUÉ ETAPA ESTÁ EL PROSPECTO

Usar estados que representen avance comercial real.

Enum recomendado:

```text
pending
in_progress
interested
opportunity
quote
customer
discarded
```

Labels:

```text
Pendiente
En gestión
Interesado
Oportunidad
Cotización
Cliente
Descartado
```

Definiciones:

## Pendiente

Nunca se inició una gestión comercial relevante.

## En gestión

Ya hubo alguna interacción o intento de gestión, pero todavía no existe interés comercial confirmado.

## Interesado

La empresa manifestó interés concreto.

## Oportunidad

Existe una necesidad comercial identificada y con potencial real.

## Cotización

Existe una cotización solicitada o enviada.

## Cliente

Se concretó una operación o relación comercial.

## Descartado

No corresponde continuar la gestión.

---

# 7. VISITADO TAMPOCO DEBE SER EL ESTADO PRINCIPAL DEL PIPELINE

"Visitado" describe algo que ocurrió.

No necesariamente representa una etapa comercial.

Ejemplo:

```text
Empresa visitada.
Responsable no estaba.
```

El prospecto puede quedar:

```text
Estado comercial: En gestión
```

y el historial muestra:

```text
Actividad: Visita
Resultado: No estaba
```

Por lo tanto:

```text
Visitado
```

debe ser principalmente una propiedad derivada del historial de actividades.

---

# 8. RESULTADO = QUÉ PASÓ EN ESA INTERACCIÓN

El resultado pertenece a cada activity.

No al prospecto global.

Catálogo recomendado:

```text
no_answer
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

Labels:

```text
No respondió
Cerrado
Responsable no estaba
Hablé con recepción
Hablé con responsable
Contacto efectivo
Interesado
Pidió información
Pidió cotización
Requiere seguimiento
Sin interés
Datos incorrectos
Otro
```

---

# 9. RESULTADOS SEGÚN TIPO DE ACTIVIDAD

No todos los resultados aplican a todos los canales.

## Visita

Resultados posibles:

```text
closed
not_available
reception_only
decision_maker_contact
interested
requested_info
requested_quote
follow_up
not_interested
other
```

## Llamada

Resultados posibles:

```text
no_answer
contact_made
decision_maker_contact
interested
requested_info
requested_quote
follow_up
not_interested
invalid_data
other
```

## WhatsApp

Resultados posibles:

```text
no_answer
contact_made
interested
requested_info
requested_quote
follow_up
not_interested
invalid_data
other
```

## Email

Resultados posibles:

```text
no_answer
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

# 10. CONCEPTO NUEVO: CONTACTO EFECTIVO

No utilizar "Contactado" como estado.

Sí puede existir una métrica derivada:

```text
Contacto efectivo
```

Definición:

```text
Existió una interacción bidireccional con una persona de la empresa.
```

Puede ocurrir por:

- visita;
- llamada;
- WhatsApp;
- email.

Ejemplos que SÍ cuentan:

```text
Visita + Hablé con recepción
Visita + Hablé con responsable
Llamada + Contacto efectivo
WhatsApp + Respondió
Email + Respondió
```

Ejemplos que NO cuentan:

```text
Visita + Cerrado
Visita + Responsable no estaba y nadie aportó información
Llamada + No respondió
WhatsApp enviado sin respuesta
Email enviado sin respuesta
```

---

# 11. DASHBOARD — REEMPLAZAR KPI "CONTACTADOS"

No usar como KPI principal:

```text
Contactados
```

Reemplazar por:

```text
CONTACTOS EFECTIVOS
```

Tooltip:

```text
Prospectos con al menos una interacción bidireccional durante el período.
```

---

# 12. KPIs PRINCIPALES DEL DASHBOARD

Usar:

```text
VISITADOS
CONTACTOS EFECTIVOS
INTERESADOS
OPORTUNIDADES
SEGUIMIENTOS
```

Además se puede mostrar:

```text
LLAMADAS
WHATSAPP
EMAILS
```

como métricas secundarias de actividad.

---

# 13. DEFINICIÓN EXACTA DE "VISITADOS"

Dashboard:

```text
VISITADOS
```

=

```sql
COUNT(DISTINCT prospect_id)
```

para activities donde:

```text
type = 'visit'
```

dentro del período.

No importa el resultado de la visita.

---

# 14. DEFINICIÓN EXACTA DE "CONTACTOS EFECTIVOS"

Contar prospectos únicos con al menos una activity cuyo resultado implique interacción real.

Ejemplo de result codes considerados efectivos:

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

NO considerar:

```text
no_answer
closed
not_available
invalid_data
```

Revisar semántica de `not_available`:

Si el comercial habló con recepción y le dijeron "el responsable no está", usar:

```text
reception_only
```

y entonces SÍ cuenta como contacto efectivo.

Si llegó y no había nadie con quien hablar:

```text
not_available
```

y NO cuenta.

---

# 15. MÉTRICA DE CONTACTO EFECTIVO EN GIRA

Mostrar:

```text
Visitados: 14
Contactos efectivos: 10
Tasa de contacto: 71%
```

Calcular:

```text
contact_rate = contactos_efectivos / visitados
```

---

# 16. MÉTRICAS DE CANAL

Agregar opcionalmente:

```text
Visitas físicas
Llamadas realizadas
WhatsApp
Emails
```

Estas métricas describen esfuerzo/canal.

Separarlas de resultados.

---

# 17. EJEMPLOS CORRECTOS

## Caso A

```text
Fui a la empresa.
Estaba cerrada.
```

Guardar:

```text
Activity: visit
Result: closed
Commercial status: in_progress
```

Dashboard:

```text
Visitados +1
Contactos efectivos +0
```

## Caso B

```text
Fui a la empresa.
Hablé con recepción.
El encargado no estaba.
```

Guardar:

```text
Activity: visit
Result: reception_only
Commercial status: in_progress
```

Dashboard:

```text
Visitados +1
Contactos efectivos +1
```

## Caso C

```text
Fui a la empresa.
Hablé con el responsable.
Mostró interés.
```

Guardar:

```text
Activity: visit
Result: interested
Commercial status: interested
```

Dashboard:

```text
Visitados +1
Contactos efectivos +1
Interesados +1
```

## Caso D

```text
Llamé.
No atendieron.
```

Guardar:

```text
Activity: call
Result: no_answer
Commercial status: in_progress
```

Dashboard:

```text
Visitados +0
Contactos efectivos +0
Llamadas +1
```

## Caso E

```text
Llamé.
Hablé con compras.
```

Guardar:

```text
Activity: call
Result: decision_maker_contact
Commercial status: in_progress
```

Dashboard:

```text
Visitados +0
Contactos efectivos +1
Llamadas +1
```

## Caso F

```text
WhatsApp enviado sin respuesta.
```

Guardar:

```text
Activity: whatsapp
Result: no_answer
Commercial status: in_progress
```

Dashboard:

```text
Contactos efectivos +0
```

## Caso G

```text
Respondieron WhatsApp y pidieron precio.
```

Guardar:

```text
Activity: whatsapp
Result: requested_quote
Commercial status: quote
```

Dashboard:

```text
Contactos efectivos +1
Interesados +1
```

---

# 18. MOTOR DE ESTADOS — NUEVA LÓGICA

Eliminar cualquier regla equivalente a:

```text
call answered => prospect.status = contacted
visit => prospect.status = visited
```

Reemplazar por pipeline comercial.

Reglas sugeridas:

```text
cualquier actividad válida
pending -> in_progress
```

```text
result = interested
-> interested
```

```text
result = requested_quote
-> quote
```

```text
opportunity created
-> opportunity
```

```text
sale / customer conversion
-> customer
```

No degradar estados automáticamente.

---

# 19. RANKING DE ESTADOS

Usar ranking:

```text
pending = 10
in_progress = 20
interested = 30
opportunity = 40
quote = 50
customer = 60
```

`discarded` se maneja como estado especial.

---

# 20. MIGRACIÓN DE PROSPECTOS EXISTENTES

No perder datos.

Si hoy existen estados:

```text
contacted
visited
```

crear migración.

Propuesta:

```text
contacted -> in_progress
visited -> in_progress
```

EXCEPTO cuando exista evidencia histórica de una etapa superior.

Prioridad de reconstrucción:

```text
customer
quote
opportunity
interested
in_progress
pending
```

Si hay oportunidad abierta:

```text
status >= opportunity
```

Si hubo requested_quote:

```text
status >= quote
```

Si hubo interested:

```text
status >= interested
```

Si hubo cualquier actividad:

```text
status >= in_progress
```

No sobrescribir estados superiores.

---

# 21. NO BORRAR ACTIVIDADES HISTÓRICAS

No modificar:

```text
activity.type = visit
```

por la migración.

No cambiar visitas existentes a "contact".

El historial debe conservar exactamente qué actividad ocurrió.

---

# 22. UI DE REGISTRO DE ACTIVIDAD

Flujo:

```text
1. Elegir actividad
2. Elegir resultado
3. Agregar notas
4. Definir próximo paso opcional
```

Ejemplo:

```text
Actividad
[ Visita ]

Resultado
[ Hablé con responsable ]

Notas
______________________

¿Próximo paso?
[ Crear seguimiento ]
```

---

# 23. RESULTADOS FILTRADOS POR ACTIVIDAD

El selector de resultado debe cambiar según `activity.type`.

No mostrar resultados incompatibles con el canal.

Usar matriz de compatibilidad centralizada.

---

# 24. FICHA DE PROSPECTO

Header:

```text
ASCANELLI S.A.
Maquinaria agrícola · Oncativo

Estado comercial: EN GESTIÓN
```

No mostrar simultáneamente grandes badges:

```text
Visitado
Contactado
```

En su lugar:

```text
Última visita: 09 Sep
Último contacto efectivo: 09 Sep
Última actividad: Visita
```

---

# 25. LISTADO DE PROSPECTOS

Mostrar:

```text
Estado comercial
Última actividad
Próxima acción
```

No usar `Visitado` / `Contactado` como estados excluyentes.

---

# 26. DASHBOARD DE GIRA

Ejemplo:

```text
GIRA OLIVA — TÍO PUJIO

Visitados                 14
Contactos efectivos       10
Tasa de contacto          71%
Interesados                5
Oportunidades              2
Seguimientos               4
```

Abajo:

```text
RESULTADOS DE VISITAS

Hablé con responsable      5
Hablé con recepción        5
Responsable no estaba      2
Cerrado                    1
Sin interés                1
```

---

# 27. NO CONFUNDIR VOLUMEN CON CONVERSIÓN

Ejemplo:

```text
20 visitas
14 contactos efectivos
6 interesados
2 oportunidades
```

Son cuatro dimensiones diferentes.

No tratar:

```text
Visitado
Contactado
Interesado
```

como un único enum secuencial.

---

# 28. SQL / ANALYTICS

## Visitados únicos

Conceptualmente:

```sql
count(distinct prospect_id)
where type = 'visit'
```

## Contactos efectivos únicos

Conceptualmente:

```sql
count(distinct prospect_id)
where result in (
  'reception_only',
  'decision_maker_contact',
  'contact_made',
  'interested',
  'requested_info',
  'requested_quote',
  'follow_up',
  'not_interested'
)
```

Aplicar los mismos filtros globales:

```text
fecha
comercial
gira
ciudad
categoría
```

---

# 29. TESTS OBLIGATORIOS

## Test 1

```text
Visita + cerrado
```

Resultado:

```text
Visitados = +1
Contactos efectivos = +0
```

## Test 2

```text
Visita + recepción
```

Resultado:

```text
Visitados = +1
Contactos efectivos = +1
```

## Test 3

```text
Visita + responsable
```

Resultado:

```text
Visitados = +1
Contactos efectivos = +1
```

## Test 4

```text
Llamada + no respondió
```

Resultado:

```text
Visitados = +0
Contactos efectivos = +0
Llamadas = +1
```

## Test 5

```text
Llamada + responsable
```

Resultado:

```text
Visitados = +0
Contactos efectivos = +1
```

## Test 6

```text
WhatsApp sin respuesta
```

Resultado:

```text
Contactos efectivos = +0
```

## Test 7

```text
WhatsApp respondido
```

Resultado:

```text
Contactos efectivos = +1
```

## Test 8

Una misma empresa:

```text
visita + llamada + WhatsApp
```

en mismo día.

Si todas tuvieron interacción efectiva:

```text
Visitados únicos = 1
Contactos efectivos únicos = 1
Actividades = 3
```

Nunca contar 3 empresas.

---

# 30. CRITERIOS DE ACEPTACIÓN

Esta corrección se considera terminada cuando:

- [ ] `Contactado` deja de usarse como estado comercial automático.
- [ ] `Visitado` deja de ser una etapa obligatoria del pipeline comercial.
- [ ] Existe `En gestión`.
- [ ] Actividad y resultado están separados.
- [ ] El dashboard distingue Visitados de Contactos efectivos.
- [ ] Las visitas físicas se cuentan independientemente del resultado.
- [ ] Una llamada no genera una visita.
- [ ] Un WhatsApp sin respuesta no genera contacto efectivo.
- [ ] Una conversación presencial sí puede generar contacto efectivo.
- [ ] Resultados están normalizados.
- [ ] El selector de resultados depende del tipo de actividad.
- [ ] Estados históricos se migran sin pérdida de información.
- [ ] No se degrada el pipeline automáticamente.
- [ ] Dashboard de gira usa esta nueva lógica.
- [ ] Tests descritos arriba pasan.

---

# 31. INSTRUCCIÓN A ANTIGRAVITY

Antes de implementar:

1. inspeccionar los valores reales actuales de `prospects.status`;
2. inspeccionar los valores reales actuales de `activities.type`;
3. inspeccionar los valores reales de `activities.result`;
4. identificar automatizaciones actuales que generen `contacted` o `visited`;
5. documentar qué registros históricos requieren migración.

NO asumir que el schema coincide exactamente con esta especificación.

Después:

1. crear migración segura;
2. actualizar catálogo de estados;
3. actualizar catálogo de resultados;
4. actualizar motor automático;
5. actualizar formularios;
6. actualizar dashboard;
7. actualizar dashboard de giras;
8. ejecutar tests;
9. verificar datos históricos.

---

# 32. REGLA FINAL DEL MODELO

Mantener siempre esta separación:

```text
ACTIVIDAD
¿Qué hizo el comercial?

VISITA / LLAMADA / WHATSAPP / EMAIL
```

```text
RESULTADO
¿Qué ocurrió?

NO ESTABA / HABLÉ CON RECEPCIÓN / RESPONSABLE / INTERESADO / COTIZAR...
```

```text
ESTADO COMERCIAL
¿En qué etapa del negocio estamos?

PENDIENTE / EN GESTIÓN / INTERESADO / OPORTUNIDAD / COTIZACIÓN / CLIENTE
```

Y como métricas derivadas:

```text
VISITADO
= hubo presencia física
```

```text
CONTACTO EFECTIVO
= hubo interacción bidireccional
```

Estos dos últimos son indicadores de actividad, NO estados excluyentes del pipeline.
