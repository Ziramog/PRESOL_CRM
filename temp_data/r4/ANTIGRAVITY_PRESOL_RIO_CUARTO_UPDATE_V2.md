# PRESOL CRM — Río Cuarto — UPDATE V2
Fecha de revisión de datos: 2026-10-01

## Objetivo
Actualizar la base de PRESOL CRM con la revisión completa de prospectos de Río Cuarto,
priorizando concesionarios de maquinaria vial y agrícola, agregando rental vial y abriendo
una vertical separada de contenedores marítimos ISO 20/40 pies.

## Archivos de entrada
- `PRESOL_Rio_Cuarto_CRM_UPDATE_2026-10-01.csv`
- `PRESOL_Rio_Cuarto_MASTER_Update_2026-10-01.xlsx`

La hoja **CRM Update** y el CSV contienen el contrato de datos.
La hoja **Delta Antigravity** define los cambios respecto de la versión anterior.

---

# REGLAS CRÍTICAS

## 1. NO duplicar
El import debe ser idempotente.

Clave primaria lógica preferida:
`canonical_key`

Fallback de matching:
1. nombre normalizado + ciudad;
2. aliases;
3. teléfono;
4. dirección normalizada.

Nunca resetear una ficha existente a `Prospecto` si ya está en:
`Contactado`, `Visitado`, `Interesado` o un estado más avanzado.

Nunca borrar:
- contactos,
- notas,
- actividades,
- tareas,
- oportunidades,
- historial,
- adjuntos.

## 2. Bricchi / Lonking — corrección obligatoria
La cuenta canónica es:

`bricchi-rio-cuarto` → **Bricchi Hnos. S.A.**

Aliases:
- Bricchi
- Lonking Río Cuarto
- Lonking en Bricchi

Lonking publica su punto de Río Cuarto en Bricchi Hnos., Ruta A005 km 1,2.

Si ya existen dos prospectos separados `Bricchi` y `Lonking Río Cuarto`:
- ejecutar primero un DRY RUN de merge;
- si el CRM tiene merge nativo, transferir relaciones a Bricchi y conservar trazabilidad;
- si NO hay merge nativo seguro, NO borrar nada:
  - marcar Lonking como alias/duplicado de Bricchi,
  - enlazar ambas fichas si existe mecanismo,
  - impedir nuevas actividades duplicadas,
  - conservar todo el historial.

## 3. Contenedores: NO mezclar categorías
### Contenedores marítimos ISO
- Boxtainer
- Sudamérica Contenedores

Crear como `Contenedores marítimos`.
Son leads principalmente REMOTOS. No inventar sucursal física en Río Cuarto.

### Servicios locales no confirmados como ISO
- Alzaco
- Contenedores RANQUEL
- Contenedores Imperio

No etiquetar como `marítimo ISO` hasta confirmación comercial.
Mantener subcategoría `NO confirmado marítimo ISO`.

## 4. Seguridad
Respetar RLS y permisos existentes.
Nunca usar service-role en frontend.
No exponer notas, teléfonos internos o metadata comercial en rutas públicas.

---

# CAMBIOS A INCORPORAR

## Nuevos / reforzados — Gira principal
- SALA / John Deere / PLA — A++
- Pallotti / LiuGong — A++
- Bricchi / Lonking / Apache — A++
- Metalfor — A+
- AgroRio / Tanzi — A+
- Agrorancho — A
- Grossvial — A++
- Semtraco / JCB / CASE IH — A++
- Agro GM / Massey Ferguson — A++
- Demarchi / Valtra — A++
- Aníbal Barbero / Vassalli / Don Roque — A+
- Simonassi / Lovol — A+
- RINO / Pauny — A+
- CATPRO / New Holland — A++

## Backup de maquinaria
- Agrokeegan — subir relevancia a A+
- Caon
- Ruben Marconi
- Agro Vial Fernández

## Rental vial
- Terramobil — A+
- Cantera La Helena — A+
- Casale — B+; tiene transporte propio, vender backup/picos
- Alquilo Todo — B+
- SAV Autoelevadores y Máquinas Viales — B+
- TECNAC — B

## Contenedores marítimos
- Boxtainer — A+ remoto
- Sudamérica Contenedores — A remoto

---

# GIRA PRINCIPAL
Crear o actualizar una gira BORRADOR:

**Nombre:** `Río Cuarto — Vial + Agrícola — Rev 2026-10-01`

No inventar fecha.
Si el schema exige fecha, dejar `draft/unscheduled` mediante el mecanismo existente.

Orden:
1. 10:00 — **SALA / Agrotecnología Sala S.A.** — John Deere / PLA — A++
2. 10:25 — **Pallotti Maquinarias** — LiuGong — A++
3. 10:50 — **Bricchi Hnos. S.A.** — Lonking / Apache / Hanomag / otros — A++
4. 11:15 — **Metalfor S.A. / Servicap Río Cuarto** — Metalfor — A+
5. 11:35 — **AgroRio Maquinaria Agrícola** — Tanzi — A+
6. 11:55 — **Agrorancho Maquinarias** — Multimarca — A
7. 12:15 — **Grossvial Río Cuarto** — Maquinaria vial / construcción — A++
8. 12:40 — **Semtraco S.A. - Río Cuarto** — JCB / CASE IH — A++
9. 14:00 — **Agro GM S.A. - Río Cuarto** — Massey Ferguson — A++
10. 14:25 — **Demarchi S.A.** — Valtra — A++
11. 14:50 — **Aníbal Barbero - El Amigazo SRL** — Vassalli / Don Roque — A+
12. 15:15 — **Simonassi Maquinarias Agrícolas** — Lovol — A+
13. 15:45 — **RINO Pauny** — Pauny — A+
14. 16:15 — **CATPRO Maquinarias** — New Holland Agriculture — A++

## Actividades de la gira
Para cada prospecto de `route_group = Principal`:
- tipo: `Visita`
- motivo: `Presentación comercial PRESOL — traslado de maquinaria`
- estado: `Pendiente`
- hora sugerida: `planned_time`
- orden: `route_order`

NO crear una actividad si ya existe una visita pendiente equivalente.

Desde `Actividades del día` debe poder:
- abrir ficha;
- llamar;
- WhatsApp cuando exista número utilizable;
- registrar hubo respuesta / no hubo respuesta;
- cerrar visita;
- generar próxima acción.

---

# RENTAL / CONTENEDORES
No mezclar con la gira principal.

Crear vista/lista o campaña secundaria:
`Río Cuarto — Rental + Contenedores`

Para Boxtainer y Sudamérica:
- actividad = `Llamada / WhatsApp comercial`
- objetivo = validar depósito/origen habitual de entregas a Río Cuarto,
  frecuencia, si tercerizan tramo final y tipo de container 20'/40'/HC/reefer.

---

# NOTA COMERCIAL BASE
Agregar a fichas nuevas (no duplicar la nota):

PRESOL — transporte especial.
- Camilla hidráulica: 15 TN.
- Carretón vial: 30 TN.
- Planchada útil carretón: 12 m.
- Hidrogrúa disponible.

Casos de uso:
- entrega de maquinaria nueva;
- recupero de usados;
- traslado a taller;
- movimiento entre sucursales;
- maquinaria rental base ↔ obra;
- contenedores marítimos 20'/40' cuando dimensiones/peso/carga y normativa lo permitan.

No cargar precios como tarifa contractual.
Si se conserva referencia interna, marcarla como estimada y sujeta a cotización por viaje.

---

# IMPLEMENTACIÓN
Preferir un script de una sola ejecución:
`scripts/import-rio-cuarto-update-v2.*`

Debe soportar:
1. `--dry-run`
2. validación de columnas
3. normalización de nombres/teléfonos
4. matching por `canonical_key` + aliases
5. upsert no destructivo
6. merge/alias especial Bricchi-Lonking
7. creación/actualización de gira
8. creación de actividades sin duplicar
9. reporte final

Reporte:
- nuevos
- actualizados
- preservados sin cambio
- aliases encontrados
- duplicados potenciales
- merges realizados
- merges pendientes de revisión
- actividades creadas
- actividades ya existentes
- errores

## Flujo de ejecución
1. Inspeccionar schema, tipos, RLS, RPC y scripts actuales.
2. Ejecutar `dry-run`.
3. Si NO hay errores críticos ni merges ambiguos, ejecutar import real.
4. Si aparece un merge ambiguo, detener sólo ese merge, continuar con el resto y reportarlo.
5. Verificar UI.

---

# QA FINAL
Comprobar explícitamente:
- Bricchi existe una sola vez como cuenta canónica.
- `Lonking Río Cuarto` no genera segunda agenda/actividad.
- SALA, Agro GM, Metalfor, AgroRio y Agrorancho fueron incorporados.
- Agrokeegan quedó actualizado.
- Terramobil y La Helena están bajo rental.
- Boxtainer y Sudamérica están bajo contenedores marítimos y NO como sucursales locales.
- Alzaco/RANQUEL/Imperio no tienen tag marítimo ISO sin confirmación.
- 14 prospectos principales aparecen en el orden de la gira.
- CATPRO está sugerido a las 16:15 por su horario publicado.
- estados comerciales previos fueron preservados.
- no hubo pérdida de contactos/notas/actividades previas.

## Links de ruta
Tramo mañana:
https://www.google.com/maps/dir/?api=1&origin=RN36+km+609%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&destination=Acceso+005+%E2%80%93+Circunvalaci%C3%B3n%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&waypoints=RN+A005+km+3%2C5%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Ruta+A005+km+1%2C2%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Ruta+A005+km+2%2C5-3%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Colectora+Dr.+Alfredo+Palacios+2594%2C+RN+A005+km+3%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Ruta+A005+km+3%2C5%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|RN+A005%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&travelmode=driving

Tramo tarde:
https://www.google.com/maps/dir/?api=1&origin=Ruta+8+km+606%2C5%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&destination=Av.+Godoy+Cruz+564%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&waypoints=Av.+Godoy+Cruz+485%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Av.+Godoy+Cruz+520%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Av.+Amadeo+Sabattini+2950%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|RN+A005+km+10%2C5%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&travelmode=driving
