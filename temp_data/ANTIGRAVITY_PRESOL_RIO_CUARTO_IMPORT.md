# PRESOL CRM — Importación gira Río Cuarto (Vial + Agrícola)

## Objetivo
Incorporar al CRM PRESOL los prospectos del archivo `PRESOL_Rio_Cuarto_CRM_import.csv`,
crear una gira comercial ordenada con inicio a las 10:00 y dejar cada prospecto listo
para operar desde **Actividades del día**.

## Archivos de entrada
- `PRESOL_Rio_Cuarto_CRM_import.csv`
- `PRESOL_Rio_Cuarto_Concesionarios_Gira_CRM.xlsx`

Usar la hoja **CRM Import** como contrato de datos. No inventar contactos personales,
emails, WhatsApp ni direcciones faltantes.

## Reglas de implementación
1. Inspeccionar primero el esquema actual de PRESOL CRM, tipos, RPC, migraciones,
   seed/imports existentes y convenciones del proyecto.
2. No hacer migraciones destructivas.
3. El import debe ser **idempotente**:
   - normalizar `company_name`;
   - buscar duplicados por nombre normalizado + ciudad;
   - si existe, actualizar solamente campos vacíos o más confiables;
   - si no existe, crear prospecto;
   - nunca duplicar por volver a ejecutar el import.
4. Ciudad: `Río Cuarto`.
5. Provincia: `Córdoba`.
6. Estado comercial inicial: `Prospecto`.
7. No marcar como `Contactado` ni `Visitado` hasta que Juan registre la acción real.
8. Categoría principal: `Concesionario maquinaria`.
9. Subcategorías: `Vial`, `Agrícola`, `Mixto vial + agrícola`.
10. Prioridades A++ / A+ / A / B+ / B deben conservarse.
11. Guardar `route_order` y `planned_time` como metadatos de la gira o en la entidad
    equivalente que ya exista en el CRM.
12. Si el esquema actual no tiene campo para orden de gira, NO crear una arquitectura
    nueva innecesaria: usar el mecanismo existente de Giras / Actividades / Próxima acción.

## Gira
Crear una gira en estado borrador:

**Nombre:** `Río Cuarto — Concesionarios Viales + Agrícolas`

**Inicio lógico:** 10:00  
**Fecha:** no inventar. Si la fecha es obligatoria, dejar la gira sin programar o usar el
mecanismo de borrador existente del CRM.

### Orden
1. 10:00 — **Pallotti Maquinarias** — Vial / LiuGong — A++
2. 10:25 — **Grossvial Río Cuarto** — Vial / Grossvial / maquinaria vial — A++
3. 10:50 — **Semtraco Río Cuarto** — Mixto vial + agrícola / JCB / CASE IH / Erca / Piersanti — A++
4. 11:15 — **Lonking Río Cuarto** — Vial / Lonking — A+
5. 11:45 — **CATPRO Maquinarias** — Agrícola / New Holland Agriculture — A++
6. 12:10 — **Aníbal Barbero - El Amigazo SRL** — Agrícola / Vassalli / Don Roque — A+
7. 12:30 — **Demarchi S.A.** — Agrícola / Valtra — A++
8. 13:45 — **Concesionario Ruben Marconi** — Agrícola / Equipos agrícolas — A
9. 14:10 — **Agrokeegan Maquinarias** — Agrícola / Maquinaria agrícola — A
10. 14:40 — **Simonassi Maquinarias Agrícolas** — Agrícola / Lovol — A+
11. 15:10 — **RINO Pauny** — Agrícola / Pauny — A+
12. 15:40 — **Caon Maquinarias** — Agrícola / Maquinaria agrícola — A

### Backup si queda tiempo
13. Casale Maquinarias  
14. Agro Vial Fernández  
15. Bricchi Hnos. S.A.

## Actividades
Para cada prospecto principal crear una actividad pendiente:

- Tipo: `Visita`
- Motivo: `Presentación comercial PRESOL — traslado de maquinaria`
- Estado: `Pendiente`
- Hora sugerida: `planned_time`
- Orden: `route_order`

La actividad debe ser **accionable** desde `Actividades del día`, siguiendo la lógica ya
definida en PRESOL CRM:
- Abrir prospecto
- Llamar
- WhatsApp (solo cuando exista número utilizable)
- Registrar `hubo respuesta / no hubo respuesta`
- Cerrar visita
- Crear próxima acción

## Nota comercial inicial
Agregar a cada empresa una nota:

> PRESOL — proveedor de transporte especial para maquinaria.
> Camilla: capacidad 15 TN.
> Carretón vial: capacidad 30 TN.
> Hidrogrúa disponible para maniobras y apoyo.
> Objetivo de la visita: detectar frecuencia de traslados, equipos típicos, zonas,
> necesidad de entregas/recuperos y contacto responsable de Logística / Expedición /
> Posventa / Gerencia.

No colocar precios como tarifa contractual. Si se desea conservar referencia interna:
camilla ~$3.500/km carga + IVA y carretón ~$6.000/km carga + IVA, marcados explícitamente
como **estimados sujetos a cotización por viaje**.

## Datos y confidencialidad
- No exponer teléfonos o notas comerciales en rutas públicas del frontend.
- Respetar RLS / permisos existentes de Supabase.
- No usar claves service-role en el cliente.
- Mantener los datos comerciales bajo el mismo modelo de seguridad del resto de PRESOL CRM.

## Entregable técnico
Implementar preferentemente un importador/seed de una sola ejecución, por ejemplo:
`scripts/import-rio-cuarto-prospects.*`

Debe:
1. leer CSV;
2. validar columnas;
3. mostrar `dry-run`;
4. upsert idempotente;
5. crear/actualizar gira;
6. crear actividades sin duplicarlas;
7. imprimir resumen:
   - creados;
   - actualizados;
   - ya existentes;
   - omitidos por datos inválidos;
   - actividades creadas;
   - errores.

## Verificación final
Antes de cerrar:
- comparar cantidad de filas del CSV vs. prospectos procesados;
- comprobar que los 12 principales aparecen en el orden correcto;
- comprobar que `Grossvial`, `Pallotti`, `Semtraco`, `Lonking`, `CATPRO`, `Demarchi`,
  `Aníbal Barbero`, `RINO Pauny` no quedaron duplicados;
- abrir al menos 3 fichas y validar teléfono, dirección, categoría, prioridad y nota;
- validar que la gira pueda verse/accionarse desde el CRM;
- no modificar componentes visuales no relacionados.

## Rutas de referencia
**Mañana:** https://www.google.com/maps/dir/?api=1&origin=RN+A005+km+3%2C5%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&destination=Av.+Godoy+Cruz+485%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&waypoints=RN+A005%2C+X5806+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Acceso+005+%E2%80%93+Circunvalaci%C3%B3n%2C+X5800+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|RN+A005+km+5%2C+X5800+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Av.+Godoy+Cruz+564%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Av.+Godoy+Cruz+520%2C+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&travelmode=driving

**Tarde:** https://www.google.com/maps/dir/?api=1&origin=RN+A005+2708%2C+X5800+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&destination=RN8+km+608%2C+X5800+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&waypoints=Acceso+RN+A005%2C+X5800+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|Av.+Amadeo+Sabattini+2950%2C+X5800+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba|RN+A005+km+10%2C5%2C+X5804+R%C3%ADo+Cuarto%2C+C%C3%B3rdoba&travelmode=driving
