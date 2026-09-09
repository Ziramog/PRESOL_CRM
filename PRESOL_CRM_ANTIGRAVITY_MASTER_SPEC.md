# PRESOL CRM — Master Specification para Antigravity

**Proyecto:** PRESOL CRM / CRM de Giras Comerciales  
**Documento:** Especificación funcional + técnica + plan de implementación  
**Fecha base:** 2026-09-08  
**Fuente inicial:** `PRESOL_prospectos_FINAL_RESUMEN_COMPACTO_2026-09-08(2).xlsx`  
**Objetivo:** construir una aplicación web/PWA mobile-first para gestionar prospectos, giras, visitas, resultados, comentarios de Dirección, seguimientos, oportunidades y trazabilidad comercial.

---

## 0. Instrucción principal para Antigravity

Implementar este proyecto como un **CRM operativo específico para PRESOL**, no como un CRM genérico.

Prioridades absolutas:

1. **Usabilidad en celular durante una gira comercial.**
2. **Cero pérdida de información del Excel original.**
3. **Historial cronológico inmutable de actividades.**
4. **Próximo paso / seguimiento como elemento obligatorio de gestión.**
5. **Dirección debe poder observar, comentar y agregar información sin pisar las notas de campo.**
6. **Cada prospecto debe conservar su ID actual** (`RT-054`, `RT-001`, etc.) como identificador externo estable.
7. **No reemplazar historial sobrescribiendo celdas/campos.** Cada llamada, visita, comentario o resultado debe generar un registro nuevo.
8. **No reinventar ni modificar el logo PRESOL.** Si existe un asset oficial en el repositorio, utilizarlo tal cual.
9. La primera versión debe ser simple, rápida y operativa. Evitar features de CRM enterprise que no aporten al viaje comercial.
10. Antes de marcar una fase como terminada, ejecutar los criterios de aceptación definidos en este documento.

Si una decisión menor no está definida, elegir la opción más simple que respete esta especificación. No frenar el desarrollo por detalles cosméticos.

---

# 1. Problema que resuelve

PRESOL posee una base de prospectos enriquecida en Excel. La planilla contiene información estática de cada empresa y también columnas destinadas al seguimiento comercial.

El problema actual es que una planilla no resuelve bien:

- historial de múltiples visitas/llamadas;
- quién hizo cada acción;
- comentarios paralelos de Dirección;
- próximos pasos y vencimientos;
- gestión de giras/rutas;
- seguimiento desde celular;
- trazabilidad de cambios;
- oportunidades comerciales;
- métricas de conversión;
- trabajo simultáneo de varias personas.

La aplicación debe convertir la planilla en una **fuente maestra de prospectos** y trasladar el movimiento comercial a entidades históricas.

Modelo conceptual:

```text
PLANILLA INICIAL
      ↓
PROSPECTOS MAESTROS
      ↓
GIRAS / RUTAS
      ↓
VISITAS · LLAMADAS · WHATSAPP · EMAILS
      ↓
RESULTADOS
      ↓
PRÓXIMOS PASOS / TAREAS
      ↓
OPORTUNIDADES
      ↓
COTIZACIÓN / SEGUIMIENTO / VENTA
```

---

# 2. Dataset inicial confirmado

El workbook fuente contiene:

- **287 prospectos** totales.
- **162 Clase A**.
- **110 Clase B**.
- **15 Clase C**.
- **198 teléfonos OK**.
- **89 contactos a verificar**.

Hojas del workbook:

1. `Prospectos Resumen`
2. `Prospectos`
3. `Indicadores`
4. `Contactos a verificar`
5. `Servicios PRESOL`
6. `Guía de uso`

La hoja **`Prospectos` es la fuente principal de importación**.

La hoja contiene 39 columnas:

```text
ID
Estado de contacto
Corredor
Microzona
Ciudad
Clase
Puntaje operativo
Empresa
Sector
Categoría comercial
Teléfonos
Calidad del teléfono
Preguntar por
Necesidad probable
Oferta PRESOL
Gancho comercial
Acción sugerida
Responsable
Nota Dirección
Resultado
Fecha de visita
Próximo paso
Notas de campo
Teléfono principal (tel:)
Links telefónicos
Dato pendiente
Google Maps
Fuente
URL fuente
Evidencia
Calidad del dato
Origen del registro
Servicios PRESOL a ofrecer
Rubro foco enriquecimiento
Ciudad foco solicitada
Prioridad visita sugerida
Observación servicio nuevo
Fuente unificación
Notas de unificación
```

## Regla de migración

La información descriptiva queda en `prospects`.

Los campos de movimiento comercial NO deben modelarse como una simple columna editable:

- `Responsable` → asignación actual / usuario responsable.
- `Nota Dirección` → `comments`.
- `Resultado` → `activities.outcome`.
- `Fecha de visita` → `activities.occurred_at`.
- `Próximo paso` → `tasks`.
- `Notas de campo` → `activities.notes`.

Si estos campos vienen con datos durante una futura reimportación, deben convertirse a registros históricos y no perderse.

---

# 3. Alcance del MVP

## Incluido en V1

- autenticación;
- roles y permisos;
- importación de Excel;
- listado de prospectos;
- búsqueda y filtros;
- ficha completa de empresa;
- contactos de empresa;
- giras comerciales;
- paradas ordenadas dentro de una gira;
- vista mobile “Ruta de hoy”;
- botón de navegación con Google Maps;
- registro de visita, llamada, WhatsApp, email u otra actividad;
- resultados rápidos;
- notas de campo;
- comentarios de Dirección;
- responsable;
- próximos pasos / tareas;
- vencimientos;
- oportunidades comerciales;
- dashboard básico;
- historial cronológico por empresa;
- auditoría básica;
- PWA instalable;
- respaldo local del formulario si se pierde conectividad antes de guardar;
- realtime para comentarios/cambios relevantes;
- soft delete donde corresponda.

## Fuera del MVP

No implementar todavía, salvo que sea necesario para la arquitectura:

- facturación;
- ERP;
- contabilidad;
- gestión de flota;
- seguimiento GPS de camiones;
- WhatsApp API automática;
- email marketing;
- telefonía VoIP;
- generación formal de cotizaciones PDF;
- firma digital;
- automatizaciones complejas;
- integración con un proveedor de mapas para optimización algorítmica avanzada;
- IA para scoring automático.

Diseñar la base de forma que estas funciones puedan agregarse después.

---

# 4. Stack tecnológico

Usar:

```text
Frontend:        Next.js (App Router) + TypeScript
UI:              Tailwind CSS + shadcn/ui o componentes equivalentes
Backend/DB:      Supabase PostgreSQL
Auth:            Supabase Auth
Authorization:   Supabase RLS
Realtime:        Supabase Realtime
Storage:         Supabase Storage
Hosting web:     Vercel
PWA:             Web App Manifest + Service Worker
Mapas:           Google Maps mediante deep links/URLs
Importación:     script Node/TypeScript para XLSX → Supabase
Testing:         Vitest/Jest + Playwright
Validation:      Zod
Dates:           almacenar UTC; mostrar America/Argentina/Cordoba
```

### No usar MongoDB para esta V1

El dominio es altamente relacional: empresa → contactos → actividades → tareas → giras → paradas → oportunidades → comentarios. PostgreSQL simplifica integridad, consultas, métricas, joins, permisos y reporting.

---

# 5. Roles y permisos

Crear inicialmente cuatro roles.

## `admin`

Puede:

- todo;
- administrar usuarios;
- importar datos;
- editar prospectos;
- crear/editar giras;
- ver auditoría;
- restaurar registros eliminados;
- administrar catálogos.

## `direccion`

Puede:

- ver todos los prospectos;
- ver todas las giras;
- ver actividades;
- comentar;
- crear tareas;
- reasignar responsables;
- crear/editar oportunidades;
- editar datos comerciales maestros autorizados;
- acceder a dashboards.

No debería eliminar permanentemente historial.

## `comercial`

Puede:

- ver los prospectos asignados o habilitados;
- ver giras donde participa;
- registrar actividades;
- registrar visitas;
- editar contactos;
- completar resultados;
- crear tareas;
- marcar tareas propias como cumplidas;
- crear oportunidades;
- ver comentarios de Dirección;
- adjuntar imágenes/documentos.

## `viewer`

Solo lectura para prospectos, giras, historial y dashboard.

---

# 6. Modelo de datos

Usar UUID como PK interna y mantener `external_id` para el ID PRESOL del Excel.

## 6.1 Diagrama conceptual

```text
profiles
   │
   ├──────────────┐
   │              │
prospects      trips
   │              │
   │              └──── trip_stops ──── prospects
   │
   ├── contacts
   ├── activities
   ├── comments
   ├── tasks
   ├── opportunities
   └── attachments

import_runs ─── import_rows

audit_log registra mutaciones relevantes
```

---

# 7. Esquema SQL propuesto

Crear migraciones SQL reales en `supabase/migrations/`.

> Nota: se prefieren `text + check constraint` para estados de negocio que probablemente evolucionen, en lugar de enums rígidos de PostgreSQL.

```sql
create extension if not exists pgcrypto;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'viewer'
    check (role in ('admin','direccion','comercial','viewer')),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PROSPECTS
-- ============================================================
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,

  contact_status text not null default 'pending'
    check (contact_status in (
      'pending',
      'attempted',
      'contacted',
      'visited',
      'follow_up',
      'opportunity',
      'customer',
      'not_interested',
      'discarded'
    )),

  corridor text,
  microzone text,
  city text,
  class text check (class in ('A','B','C')),
  operational_score numeric,

  company_name text not null,
  sector text,
  commercial_category text,

  phones_raw text,
  primary_phone text,
  phone_links text[],
  phone_quality text,

  ask_for text,
  probable_need text,
  presol_offer text,
  sales_hook text,
  suggested_action text,

  pending_data text,
  google_maps_url text,

  source_name text,
  source_url text,
  evidence text,
  data_quality text,
  origin_record text,

  presol_services text[],
  enrichment_focus text,
  city_focus_requested boolean,
  visit_priority text,
  new_service_observation text,
  source_unification text,
  unification_notes text,

  assigned_to uuid references public.profiles(id) on delete set null,

  source_payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index prospects_company_name_idx on public.prospects using gin (to_tsvector('simple', company_name));
create index prospects_city_idx on public.prospects(city);
create index prospects_corridor_idx on public.prospects(corridor);
create index prospects_class_idx on public.prospects(class);
create index prospects_category_idx on public.prospects(commercial_category);
create index prospects_status_idx on public.prospects(contact_status);
create index prospects_assigned_idx on public.prospects(assigned_to);

-- ============================================================
-- CONTACTS
-- ============================================================
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  full_name text,
  role_title text,
  area text,
  phone text,
  whatsapp text,
  email text,
  is_primary boolean not null default false,
  notes text,
  source text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index contacts_prospect_idx on public.contacts(prospect_id);

-- ============================================================
-- TRIPS
-- ============================================================
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft','planned','in_progress','completed','cancelled')),
  trip_date date,
  start_location text,
  end_location text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

-- ============================================================
-- TRIP STOPS
-- ============================================================
create table public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  stop_order integer not null,
  status text not null default 'pending'
    check (status in ('pending','next','arrived','visited','skipped','cancelled')),
  planned_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  skip_reason text,
  route_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, prospect_id),
  unique (trip_id, stop_order)
);

create index trip_stops_trip_idx on public.trip_stops(trip_id, stop_order);
create index trip_stops_prospect_idx on public.trip_stops(prospect_id);

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete set null,
  trip_stop_id uuid references public.trip_stops(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,

  type text not null
    check (type in ('visit','call','whatsapp','email','meeting','note','other')),

  outcome text
    check (outcome is null or outcome in (
      'contacted',
      'no_answer',
      'decision_maker_unavailable',
      'interested',
      'quote_requested',
      'follow_up_required',
      'not_interested',
      'wrong_contact',
      'data_updated',
      'opportunity_detected',
      'other'
    )),

  summary text,
  notes text,
  occurred_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index activities_prospect_idx on public.activities(prospect_id, occurred_at desc);
create index activities_trip_idx on public.activities(trip_id, occurred_at desc);
create index activities_created_by_idx on public.activities(created_by, occurred_at desc);

-- ============================================================
-- COMMENTS
-- ============================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete set null,
  activity_id uuid references public.activities(id) on delete set null,
  parent_comment_id uuid references public.comments(id) on delete set null,
  body text not null,
  is_direction_note boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index comments_prospect_idx on public.comments(prospect_id, created_at desc);

-- ============================================================
-- TASKS / NEXT STEPS
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete set null,
  source_activity_id uuid references public.activities(id) on delete set null,

  title text not null,
  description text,
  type text not null default 'follow_up'
    check (type in ('call','visit','send_brochure','send_quote','follow_up','verify_data','meeting','other')),
  status text not null default 'pending'
    check (status in ('pending','in_progress','completed','cancelled')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),

  assigned_to uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index tasks_due_idx on public.tasks(status, due_at);
create index tasks_assigned_idx on public.tasks(assigned_to, status, due_at);
create index tasks_prospect_idx on public.tasks(prospect_id, status);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  source_activity_id uuid references public.activities(id) on delete set null,
  title text not null,
  description text,

  stage text not null default 'detected'
    check (stage in (
      'detected',
      'qualified',
      'quote_needed',
      'quote_sent',
      'negotiation',
      'won',
      'lost',
      'on_hold'
    )),

  service_type text,
  origin text,
  estimated_value numeric(14,2),
  currency text default 'ARS',
  probability integer check (probability between 0 and 100),
  expected_close_date date,
  lost_reason text,

  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  deleted_at timestamptz
);

create index opportunities_stage_idx on public.opportunities(stage);
create index opportunities_owner_idx on public.opportunities(owner_id, stage);
create index opportunities_prospect_idx on public.opportunities(prospect_id);

-- ============================================================
-- ATTACHMENTS
-- ============================================================
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ============================================================
-- IMPORT RUNS
-- ============================================================
create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_hash text,
  status text not null default 'processing'
    check (status in ('processing','completed','failed','partial')),
  total_rows integer default 0,
  inserted_rows integer default 0,
  updated_rows integer default 0,
  skipped_rows integer default 0,
  error_rows integer default 0,
  imported_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.import_runs(id) on delete cascade,
  row_number integer not null,
  external_id text,
  status text not null check (status in ('inserted','updated','skipped','error')),
  message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
```

---

# 8. Timestamps `updated_at`

Crear trigger reutilizable:

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Aplicar a todas las tablas con `updated_at`.

---

# 9. RLS / seguridad

Activar RLS en todas las tablas de negocio.

Reglas mínimas:

- usuario no autenticado: sin acceso;
- `admin`: acceso total;
- `direccion`: lectura total + escritura comercial;
- `comercial`: lectura del conjunto habilitado y escritura de actividades/tareas/contactos/oportunidades;
- `viewer`: solo SELECT;
- nunca permitir que un usuario común modifique `created_by` de un registro existente;
- no permitir hard delete desde UI;
- archivos deben estar en bucket privado y servirse con signed URLs.

Crear helpers SQL para consultar rol del usuario autenticado y evitar repetir lógica.

Ejemplo conceptual:

```sql
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;
```

No usar `service_role` desde el browser.

---

# 10. Mapeo exacto Excel → base de datos

## 10.1 Campos maestros

| Excel | DB | Regla |
|---|---|---|
| ID | `prospects.external_id` | obligatorio, único, no modificar |
| Estado de contacto | `prospects.contact_status` | mapear a slug interno |
| Corredor | `prospects.corridor` | texto |
| Microzona | `prospects.microzone` | texto |
| Ciudad | `prospects.city` | texto |
| Clase | `prospects.class` | A/B/C |
| Puntaje operativo | `prospects.operational_score` | numérico |
| Empresa | `prospects.company_name` | obligatorio |
| Sector | `prospects.sector` | texto |
| Categoría comercial | `prospects.commercial_category` | texto |
| Teléfonos | `prospects.phones_raw` | preservar exactamente |
| Calidad del teléfono | `prospects.phone_quality` | texto |
| Preguntar por | `prospects.ask_for` | texto |
| Necesidad probable | `prospects.probable_need` | texto largo |
| Oferta PRESOL | `prospects.presol_offer` | texto largo |
| Gancho comercial | `prospects.sales_hook` | texto largo |
| Acción sugerida | `prospects.suggested_action` | texto largo |
| Teléfono principal (tel:) | `prospects.primary_phone` | limpiar prefijo `tel:` si corresponde |
| Links telefónicos | `prospects.phone_links` | split por ` | ` |
| Dato pendiente | `prospects.pending_data` | texto |
| Google Maps | `prospects.google_maps_url` | URL |
| Fuente | `prospects.source_name` | texto |
| URL fuente | `prospects.source_url` | URL nullable |
| Evidencia | `prospects.evidence` | texto largo |
| Calidad del dato | `prospects.data_quality` | texto |
| Origen del registro | `prospects.origin_record` | texto |
| Servicios PRESOL a ofrecer | `prospects.presol_services` | split por ` | ` |
| Rubro foco enriquecimiento | `prospects.enrichment_focus` | texto |
| Ciudad foco solicitada | `prospects.city_focus_requested` | Sí/No → boolean |
| Prioridad visita sugerida | `prospects.visit_priority` | texto |
| Observación servicio nuevo | `prospects.new_service_observation` | texto |
| Fuente unificación | `prospects.source_unification` | texto |
| Notas de unificación | `prospects.unification_notes` | texto |

## 10.2 Campos históricos

| Excel | Destino | Regla |
|---|---|---|
| Responsable | `prospects.assigned_to` o texto legado | si existe usuario con ese nombre, asignar; si no, preservar en `source_payload` |
| Nota Dirección | `comments` | crear comentario con `is_direction_note=true` |
| Resultado | `activities` | crear actividad importada si no está vacío |
| Fecha de visita | `activities.occurred_at` | usar con el resultado/notas correspondientes |
| Próximo paso | `tasks` | crear tarea importada si no está vacío |
| Notas de campo | `activities.notes` | anexar a actividad importada |

## 10.3 Preservación total

Guardar en `prospects.source_payload` el JSON completo de la fila Excel original.

Esto es obligatorio incluso cuando el campo también se normalice.

Beneficios:

- auditoría;
- debugging de importación;
- futuras migraciones;
- cero pérdida de columnas no previstas.

---

# 11. Importador XLSX

Crear:

```text
scripts/import-prospects.ts
```

Debe:

1. abrir la hoja `Prospectos`;
2. validar los encabezados esperados;
3. generar hash del archivo;
4. crear `import_runs`;
5. procesar cada fila;
6. identificar por `external_id`;
7. hacer UPSERT idempotente;
8. no duplicar prospectos si se ejecuta dos veces;
9. preservar `source_payload`;
10. normalizar booleanos y listas;
11. registrar errores fila por fila en `import_rows`;
12. imprimir resumen final;
13. abortar si falta `ID` o `Empresa`;
14. no sobrescribir con `null` un campo del CRM que ya fue enriquecido manualmente, salvo que se use modo explícito `--force`.

CLI deseada:

```bash
npm run import:prospects -- ./data/PRESOL_prospectos.xlsx
```

Opcional:

```bash
npm run import:prospects -- ./data/PRESOL_prospectos.xlsx --dry-run
npm run import:prospects -- ./data/PRESOL_prospectos.xlsx --force
```

### Criterio de aceptación del importador

Primera importación:

```text
prospects = 287
```

Debe poder comprobar:

```text
Clase A = 162
Clase B = 110
Clase C = 15
Teléfonos OK = 198
A verificar = 89
```

La suma A+B+C debe ser 287.

---

# 12. Catálogo de Servicios PRESOL

La hoja `Servicios PRESOL` contiene conceptos comerciales que deben quedar disponibles como referencia.

Crear tabla opcional `service_catalog` o seed estático inicial.

Servicios actualmente relevantes:

- Transporte de áridos/materiales.
- Barquilla hidrogrúa.
- Percha para pallets.
- Piletas / PRFV.
- Maquinaria agrícola.

No usar estos nombres como límite rígido: la oferta puede crecer.

Cada servicio puede tener:

```text
name
commercial_use
enabled
created_at
updated_at
```

---

# 13. Estados de contacto

La empresa tiene un estado comercial general. Las actividades tienen resultados individuales.

No confundir ambos conceptos.

## Estado general del prospecto

```text
pending          Pendiente
attempted        Intento de contacto
contacted        Contactado
visited          Visitado
follow_up        En seguimiento
opportunity      Oportunidad abierta
customer         Cliente
not_interested   Sin interés
discarded        Descartado
```

## Resultados rápidos de una actividad

```text
contacted                   Contactado
no_answer                   No atendió
decision_maker_unavailable          Decisor no estaba
interested                  Interesado
quote_requested             Pidió cotización
follow_up_required          Requiere seguimiento
not_interested              Sin interés
wrong_contact               Contacto incorrecto
data_updated                Datos actualizados
opportunity_detected        Oportunidad detectada
other                       Otro
```

Corregir cualquier typo del slug al implementarlo; los valores deben ser coherentes entre schema, Zod y UI.

---

# 14. Reglas automáticas de estado

Aplicar reglas sugeridas desde el service layer, no mediante triggers complejos.

Ejemplos:

- primera llamada sin respuesta → `attempted`;
- llamada/visita con contacto → `contacted`;
- visita registrada → mínimo `visited`;
- resultado `follow_up_required` → `follow_up`;
- oportunidad creada → `opportunity`;
- oportunidad `won` → opcionalmente `customer`;
- `not_interested` explícito → `not_interested`.

No degradar automáticamente un estado comercial avanzado por una actividad posterior menor.

---

# 15. Regla central: el próximo paso

El CRM debe favorecer que una interacción termine con una acción futura cuando corresponda.

Cuando el resultado sea:

- `interested`;
- `quote_requested`;
- `follow_up_required`;
- `opportunity_detected`;

mostrar inmediatamente:

```text
¿CUÁL ES EL PRÓXIMO PASO?

Tipo
Fecha/hora
Responsable
Nota
```

Permitir “Sin próximo paso” solo con confirmación explícita.

Nunca sobrescribir tareas anteriores; una tarea tiene su propio ciclo de vida.

---

# 16. Giras comerciales

Una gira representa una salida comercial organizada.

Ejemplo piloto:

```text
Río Tercero → Oncativo
```

Para el piloto actual, **Río Tercero funciona como punto de salida pero no debe incorporarse automáticamente como conjunto de prospectos de la gira**. La selección debe permitir cargar únicamente las empresas que quedan por delante en el recorrido y debe incluir Oncativo.

No inferir toda la ruta solo por nombre de corredor: el usuario debe poder seleccionar, eliminar y reordenar paradas.

## Datos de una gira

```text
Nombre
Fecha
Estado
Responsable
Origen
Destino
Descripción
Cantidad de paradas
Visitadas
Pendientes
Oportunidades generadas
```

## Gestión de paradas

Permitir:

- agregar prospectos;
- quitar prospectos antes de iniciar;
- drag-and-drop/reordenamiento;
- marcar “siguiente”;
- marcar llegada;
- registrar visita;
- saltear con motivo;
- completar;
- ver progreso.

---

# 17. Google Maps

No implementar un motor de routing propio en V1.

Cada prospecto ya puede contener `google_maps_url`.

En ficha y en “Ruta de hoy” mostrar botón prominente:

```text
NAVEGAR
```

Comportamiento:

1. si existe `google_maps_url`, abrirlo;
2. si no existe pero hay datos suficientes de empresa + ciudad, generar URL de búsqueda Google Maps;
3. abrir en nueva pestaña / app Maps del dispositivo cuando corresponda.

Agregar también:

```text
LLAMAR
WHATSAPP
```

solo si existe teléfono utilizable.

No automatizar mensajes en V1; abrir deep links.

---

# 18. Pantallas V1

## 18.1 Login

Ruta:

```text
/login
```

Simple.

- logo PRESOL oficial si está disponible;
- email + password/magic link según configuración;
- estado de carga;
- mensajes de error claros.

---

## 18.2 Dashboard

Ruta:

```text
/dashboard
```

KPIs mínimos:

```text
Prospectos totales
Clase A
Contactados
Visitados
Seguimientos pendientes
Seguimientos vencidos
Oportunidades abiertas
Oportunidades ganadas
```

Widgets:

- actividad reciente;
- tareas de hoy;
- próximos vencimientos;
- pipeline de oportunidades;
- cobertura por ciudad;
- cobertura por categoría;
- última gira / gira activa.

Filtros:

```text
fecha
responsable
corredor
ciudad
categoría
clase
```

No sobrecargar visualmente.

---

## 18.3 Prospectos

Ruta:

```text
/prospects
```

Desktop: tabla.  
Mobile: cards compactas.

Columnas visibles principales:

```text
ID
Empresa
Ciudad
Clase
Categoría
Prioridad
Estado
Responsable
Próximo paso
```

Filtros:

- búsqueda global;
- clase A/B/C;
- estado;
- corredor;
- ciudad;
- categoría comercial;
- prioridad;
- calidad del teléfono;
- responsable;
- con/sin próximo paso;
- seguimiento vencido;
- con/sin oportunidad.

Orden inicial recomendado:

```text
Prioridad → Clase → Puntaje operativo → Empresa
```

Agregar posibilidad de guardar filtros más adelante; no obligatorio V1.

---

## 18.4 Ficha de prospecto

Ruta:

```text
/prospects/[id]
```

Header:

```text
RT-054
ASCANELLI S.A.
Clase A · Maquinaria agrícola
Río Tercero
Estado: Pendiente
Prioridad: Muy alta
```

Acciones rápidas:

```text
[NAVEGAR]
[LLAMAR]
[WHATSAPP]
[REGISTRAR ACTIVIDAD]
[CREAR TAREA]
[CREAR OPORTUNIDAD]
```

Secciones:

### Resumen comercial

- sector;
- necesidad probable;
- oferta PRESOL;
- gancho comercial;
- acción sugerida;
- servicios a ofrecer.

### Contacto

- teléfonos;
- calidad;
- preguntar por;
- contactos cargados;
- dato pendiente.

### Historial

Timeline unificado por fecha con:

- actividades;
- comentarios;
- tareas creadas/completadas;
- oportunidades relevantes.

### Próximos pasos

Mostrar tareas abiertas primero.

### Comentarios de Dirección

Visualmente diferenciados, pero no usar un color agresivo.

### Investigación / fuente

- fuente;
- URL;
- evidencia;
- calidad del dato;
- origen;
- observaciones de unificación.

Esta sección puede estar colapsada por defecto.

---

## 18.5 Giras

Ruta:

```text
/trips
```

Cards:

```text
Nombre
Fecha
Responsable
Estado
Visitadas / total
Oportunidades
```

Acciones:

- crear;
- abrir;
- duplicar;
- editar;
- completar.

---

## 18.6 Constructor de gira

Ruta:

```text
/trips/new
/trips/[id]/edit
```

Flujo:

1. nombre;
2. fecha;
3. origen;
4. destino;
5. responsable;
6. seleccionar prospectos;
7. filtrar por ciudad/clase/categoría/prioridad;
8. ordenar;
9. guardar como `planned`.

Mostrar contador seleccionado.

---

## 18.7 Ruta de hoy / modo terreno

Ruta:

```text
/trips/[id]/route
```

Esta es la pantalla más importante en celular.

Debe ser extremadamente simple.

Header:

```text
RÍO TERCERO → ONCATIVO
7 / 24 visitadas
```

Card principal:

```text
SIGUIENTE

Empresa
Ciudad
Clase
Prioridad
Preguntar por
Teléfono
Necesidad probable

[NAVEGAR]
[LLAMAR]
[WHATSAPP]
[INICIAR / REGISTRAR VISITA]
```

Debajo:

```text
Siguiente 2
Siguiente 3
```

Estados visuales claros:

```text
Pendiente
Siguiente
Visitada
Salteada
```

No forzar scroll horizontal.

---

## 18.8 Modal / sheet Registrar actividad

En mobile usar bottom sheet/full screen.

Campos:

```text
Tipo
Resultado
Resumen corto
Notas
Fecha/hora
Contacto relacionado
```

Resultados como botones grandes.

Después del resultado, si aplica:

```text
Crear próximo paso
Crear oportunidad
Actualizar contacto
```

Guardar debe ser rápido.

---

## 18.9 Tareas

Ruta:

```text
/tasks
```

Tabs/filtros:

```text
Hoy
Vencidas
Próximas
Completadas
Todas
```

Card:

```text
Hora/fecha
Empresa
Acción
Responsable
Prioridad
```

Acciones:

- completar;
- reprogramar;
- abrir empresa;
- registrar actividad desde la tarea.

---

## 18.10 Oportunidades

Ruta:

```text
/opportunities
```

V1 puede ser lista + filtros. Kanban opcional si es rápido y estable.

Stages:

```text
Detectada
Calificada
Cotizar
Cotización enviada
Negociación
Ganada
Perdida
En pausa
```

Campos principales:

```text
Empresa
Título
Servicio
Etapa
Responsable
Valor estimado
Próxima acción
Fecha estimada de cierre
```

---

# 19. Timeline unificado

La ficha del prospecto debe mostrar un timeline cronológico.

Ejemplo:

```text
09/09 10:20 · VISITA · Juan
Interesado
Hablaron con responsable de logística.

09/09 10:24 · TAREA CREADA
Enviar brochure — vence 10/09

09/09 12:05 · DIRECCIÓN
“Averiguar cantidad de movimientos mensuales.”

10/09 09:15 · LLAMADA · Juan
Solicitó cotización.
```

No guardar el timeline como tabla duplicada. Construirlo desde entidades existentes mediante query/view/service.

---

# 20. Comentarios de Dirección

Requisitos:

- no deben reemplazar notas de campo;
- deben mostrar autor y hora;
- soportar respuesta simple con `parent_comment_id`;
- posibilidad de convertir un comentario en tarea;
- actualización realtime;
- flag visual `is_direction_note=true`.

MVP no necesita menciones `@usuario`, pero dejar estructura preparada.

---

# 21. Contactos dentro de una empresa

La columna `Preguntar por` es inicialmente una referencia no estructurada.

Durante la gira el equipo debe poder crear contactos reales:

```text
Nombre
Cargo
Área
Teléfono
WhatsApp
Email
Notas
Principal sí/no
```

Ejemplo:

```text
Carlos Gómez
Responsable de logística
+54...
```

No sobrescribir `ask_for`; conservarlo como dato original/comercial.

---

# 22. Archivos y fotos

Permitir adjuntar desde celular:

- foto de tarjeta personal;
- foto de fachada/cartel;
- PDF;
- imagen;
- documento relacionado.

Bucket privado:

```text
crm-attachments
```

Path sugerido:

```text
prospects/{prospect_id}/{yyyy}/{mm}/{uuid}-{filename}
```

Aplicar límite de tamaño razonable desde frontend y backend.

No almacenar binarios en PostgreSQL.

---

# 23. Mobile / PWA

La aplicación debe ser **mobile-first**.

Requisitos:

- manifest;
- ícono instalable;
- `display: standalone`;
- splash/background coherente;
- viewport correcto;
- botones táctiles grandes;
- safe areas iPhone/Android;
- evitar tablas complejas en mobile;
- navegación inferior en mobile.

Bottom navigation sugerida:

```text
Inicio
Ruta
Prospectos
Tareas
Más
```

Desktop puede usar sidebar.

## Conectividad deficiente

No implementar sincronización offline completa en V1.

Sí implementar:

- indicador offline;
- conservar borrador de actividad en `localStorage` o IndexedDB mientras no se haya guardado;
- no limpiar el formulario hasta recibir confirmación del servidor;
- permitir reintentar;
- evitar doble inserción usando un `client_request_id` UUID opcional en activities/tasks si se implementa retry automático.

Esto es importante para uso en ruta.

---

# 24. Diseño UX/UI

Objetivo visual:

```text
profesional
industrial
limpio
rápido
alto contraste
poca decoración
```

No diseñar como un dashboard SaaS genérico excesivamente brillante.

Reglas:

- usar branding PRESOL oficial disponible;
- no redibujar ni deformar el logo;
- fondo claro por defecto;
- excelente legibilidad a pleno día desde celular;
- tipografía sans-serif muy legible;
- jerarquías fuertes;
- estados con badges discretos;
- botones primarios inequívocos;
- notas largas truncadas con expansión;
- todos los formularios deben funcionar con teclado móvil;
- loading skeletons;
- empty states útiles;
- toast solo para confirmaciones secundarias; acciones críticas deben tener feedback visible.

---

# 25. Search

Implementar búsqueda por:

- nombre de empresa;
- ID PRESOL;
- ciudad;
- teléfono;
- sector;
- categoría;
- contacto.

Para 287 registros no hace falta un motor externo.

PostgreSQL + `ILIKE`/FTS es suficiente.

No incorporar Algolia/Elastic.

---

# 26. Dashboard / métricas

Métricas iniciales:

## Cobertura

```text
Prospectos totales
Pendientes
Contactados
Visitados
```

## Calidad

```text
Teléfonos OK
A verificar
```

## Prioridad

```text
Clase A/B/C
Prioridad visita
```

## Ejecución

```text
Visitas por día
Llamadas por día
Actividades por responsable
```

## Seguimiento

```text
Tareas hoy
Tareas vencidas
Tareas sin responsable
Prospectos visitados sin próximo paso
```

## Funnel

```text
Contactado
Visitado
Interesado
Oportunidad
Cotización
Ganado
```

## Segmentación

```text
por ciudad
por corredor
por categoría comercial
por responsable
por servicio PRESOL
```

Toda métrica debe poder rastrearse a datos transaccionales reales.

No hardcodear números en frontend.

---

# 27. Indicadores de alerta

Mostrar alertas útiles:

```text
Seguimiento vencido
Prospecto visitado sin próximo paso
Clase A sin contacto
Teléfono a verificar
Oportunidad sin tarea abierta
Gira activa con paradas pendientes
```

No enviar push/email en V1; solo mostrar en aplicación.

---

# 28. Reglas de negocio importantes

1. `external_id` PRESOL es único e inmutable.
2. El historial no se sobrescribe.
3. Activities, comments y completed tasks no se borran físicamente desde UI.
4. Una visita puede estar relacionada con una gira y parada, pero también existir fuera de una gira.
5. Una tarea puede existir sin gira, pero siempre debe pertenecer a un prospecto.
6. Una oportunidad siempre pertenece a un prospecto.
7. Al marcar una parada `visited`, debe existir al menos una actividad de tipo `visit` relacionada o generarse en el mismo flujo.
8. Al saltear una parada pedir motivo.
9. Al marcar oportunidad `lost`, pedir `lost_reason`.
10. Al marcar una tarea completada, guardar `completed_at`.
11. Todas las fechas de base en UTC.
12. UI muestra zona horaria `America/Argentina/Cordoba`.
13. No mostrar `source_payload` directamente salvo debug/admin.
14. Las URLs externas deben validarse antes de renderizar como link.
15. Teléfono inválido no debe romper botones call/WhatsApp.

---

# 29. Auditoría

Registrar como mínimo:

- edición de datos maestros de prospecto;
- cambio de responsable;
- cambio manual de estado;
- creación/edición/eliminación lógica de oportunidad;
- reprogramación de tarea;
- cambio de orden de gira;
- importaciones;
- acciones administrativas.

No es necesario registrar cada simple SELECT.

---

# 30. Supabase Realtime

Usar Realtime de forma acotada.

Suscripciones útiles:

- comentarios del prospecto abierto;
- actividades nuevas del prospecto abierto;
- cambios de tarea relevantes;
- estado/progreso de la gira activa.

No suscribirse a toda la DB globalmente.

---

# 31. Arquitectura de frontend

Estructura sugerida:

```text
src/
  app/
    (auth)/
      login/
    (crm)/
      dashboard/
      prospects/
        [id]/
      trips/
        new/
        [id]/
          edit/
          route/
      tasks/
      opportunities/
      settings/

  components/
    crm/
      prospect-card.tsx
      prospect-table.tsx
      prospect-header.tsx
      prospect-timeline.tsx
      activity-form.tsx
      activity-outcome-grid.tsx
      task-form.tsx
      comment-thread.tsx
      trip-stop-card.tsx
      route-progress.tsx
      opportunity-form.tsx
    layout/
    ui/

  features/
    prospects/
    activities/
    comments/
    trips/
    tasks/
    opportunities/
    dashboard/

  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
    auth/
    validation/
    dates/
    phones/
    maps/
    permissions/

  types/
    database.ts
    crm.ts

scripts/
  import-prospects.ts
  seed-services.ts

supabase/
  migrations/
  seed.sql

tests/
  unit/
  e2e/
```

No crear una arquitectura excesivamente abstracta.

---

# 32. Data access

Preferencia:

- Server Components para lectura inicial donde aporte;
- Server Actions o Route Handlers para mutaciones sensibles;
- Supabase browser client solo cuando realtime/interactividad lo justifique;
- Zod en frontera de entrada;
- RLS siempre como última línea de seguridad.

No confiar en ocultar botones como mecanismo de autorización.

---

# 33. Validaciones

Ejemplos:

## Prospect

```text
external_id required
company_name required
class A/B/C/null
operational_score numeric/null
```

## Activity

```text
prospect_id required
type required
occurred_at required
created_by from session, never from browser payload trusted
```

## Task

```text
prospect_id required
title required
status valid
due_at optional
```

## Trip stop

```text
trip_id required
prospect_id required
stop_order >= 1
unique trip+prospect
```

---

# 34. Teléfonos

Conservar siempre `phones_raw`.

Crear utilidades:

```text
normalizePhoneForTel()
normalizePhoneForWhatsApp()
isCallablePhone()
```

No modificar destructivamente el teléfono original importado.

Botón WhatsApp:

- usar solo dígitos en enlace;
- Argentina requiere atención a formatos; si no se puede normalizar con confianza, ocultar WhatsApp o usar teléfono ya normalizado del Excel;
- no inventar código de área.

---

# 35. UX específica de terreno

Registrar una visita debe requerir muy pocos taps.

Objetivo:

```text
Abrir siguiente empresa
→ Navegar
→ Registrar visita
→ Seleccionar resultado
→ Nota breve
→ Próximo paso
→ Guardar
→ Mostrar siguiente empresa
```

La aplicación NO debe obligar al usuario a completar todos los campos descriptivos antes de seguir.

Permitir notas rápidas.

Mostrar `Preguntar por`, `Necesidad probable` y `Gancho comercial` antes de entrar a la empresa.

---

# 36. Vista previa antes de una visita

En “Ruta de hoy”, card del prospecto debe mostrar información de preparación:

```text
Empresa
Categoría
Preguntar por
Necesidad probable
Gancho comercial
Dato pendiente
```

No mostrar toda la investigación salvo expansión.

Esto transforma la base enriquecida en una guía de conversación.

---

# 37. Dirección

Dirección debe tener una experiencia distinta.

Dashboard de Dirección:

```text
Gira activa
Paradas visitadas / total
Últimas actividades
Resultados importantes
Comentarios pendientes
Oportunidades detectadas
Seguimientos vencidos
```

En cada empresa:

```text
[AGREGAR COMENTARIO DE DIRECCIÓN]
[CREAR TAREA]
[ASIGNAR RESPONSABLE]
```

Un comentario no debe requerir editar la ficha.

---

# 38. Vistas SQL / queries útiles

Crear views cuando simplifiquen reporting.

## `prospect_latest_activity`

Última actividad por prospecto.

## `prospect_open_task_summary`

Próxima tarea abierta + cantidad vencida.

## `trip_progress`

```text
trip_id
total_stops
visited_stops
skipped_stops
pending_stops
progress_pct
```

## `sales_funnel_summary`

Agregación por estado/etapa.

No duplicar datos derivados en tablas si pueden calcularse eficientemente.

---

# 39. Performance

La base inicial es pequeña, pero diseñar correctamente.

- paginación server-side en prospectos;
- índices definidos;
- evitar N+1;
- cargar timeline paginado si crece;
- no enviar `source_payload` en listados;
- no descargar todos los prospectos para filtrar en cliente;
- debounce búsqueda;
- imágenes con thumbnails/compresión si se agregan fotos.

---

# 40. Estados de carga/error

Toda mutación debe tener:

```text
loading
success
error
retry cuando corresponda
```

No perder texto escrito si falla una mutación.

Errores técnicos no deben mostrar stack traces al usuario.

---

# 41. Testing

## Unit tests

Mínimos:

- mapping Excel → prospect;
- normalización Sí/No;
- split de servicios;
- split de links telefónicos;
- mapping de estado legacy;
- phone helpers;
- business rules de próximos pasos;
- status transition helper;
- date timezone helpers.

## Integration tests

- crear activity;
- activity asociada a trip_stop;
- completar stop;
- crear task desde activity;
- crear opportunity;
- comment Dirección;
- role permissions.

## E2E Playwright

Flujos mínimos:

### Flujo 1 — Comercial

```text
login
abrir gira
abrir siguiente prospecto
registrar visita
marcar interesado
crear próximo paso
guardar
ver parada visitada
```

### Flujo 2 — Dirección

```text
login
abrir dashboard
abrir prospecto visitado
agregar comentario
crear tarea para comercial
```

### Flujo 3 — Seguimiento

```text
abrir tareas
completar una tarea
registrar llamada
crear oportunidad
```

### Flujo 4 — Importación

Validar que después de importar:

```text
287 prospectos
162 A
110 B
15 C
```

---

# 42. Seed / usuario inicial

Crear mecanismo documentado para primer administrador.

No hardcodear credenciales en repositorio.

Después de registrar usuario en Supabase Auth, permitir promoverlo desde SQL/seed seguro:

```sql
update public.profiles
set role = 'admin'
where id = '<AUTH_USER_UUID>';
```

---

# 43. Variables de entorno

Crear `.env.example` sin secretos:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TIMEZONE=America/Argentina/Cordoba
```

`SUPABASE_SERVICE_ROLE_KEY` solo server-side y scripts de administración/importación.

No exponerla con prefijo `NEXT_PUBLIC_`.

---

# 44. README

El repositorio debe contener un README claro con:

```text
objetivo
stack
prerrequisitos
setup local
variables env
Supabase setup
migrations
seed
cómo importar Excel
cómo correr tests
cómo ejecutar dev
cómo deployar a Vercel
roles
estructura principal
```

---

# 45. Fases de implementación

## Fase 0 — Bootstrap

- crear app;
- TypeScript;
- Tailwind;
- Supabase clients;
- auth middleware;
- layout desktop/mobile;
- `.env.example`;
- lint/test setup.

**DONE cuando:** login y sesión funcionan localmente.

---

## Fase 1 — DB + Auth + RLS

- migraciones;
- profiles;
- RLS;
- roles;
- updated_at;
- seed inicial.

**DONE cuando:** usuarios de roles distintos reciben permisos correctos.

---

## Fase 2 — Importador Excel

- script XLSX;
- import_runs;
- import_rows;
- upsert idempotente;
- source_payload;
- summary.

**DONE cuando:** base contiene exactamente 287 prospectos y métricas iniciales correctas.

---

## Fase 3 — Prospectos

- listado;
- filtros;
- búsqueda;
- ficha;
- edición autorizada;
- contacts.

**DONE cuando:** cualquier prospecto importado puede encontrarse y abrirse desde desktop/mobile.

---

## Fase 4 — Actividades + Timeline + Comentarios

- activities;
- activity form;
- outcomes;
- comments;
- direction notes;
- timeline;
- realtime.

**DONE cuando:** dos usuarios pueden registrar/ver movimientos sin sobrescribirse.

---

## Fase 5 — Tareas / próximos pasos

- create task;
- today/overdue/upcoming;
- complete/reschedule;
- task from activity;
- alerts.

**DONE cuando:** no se necesita una planilla para recordar seguimientos.

---

## Fase 6 — Giras / Route Mode

- trips;
- builder;
- trip_stops;
- orden;
- progreso;
- route mobile;
- Google Maps;
- skip/visit.

**DONE cuando:** una gira completa puede ejecutarse desde celular.

---

## Fase 7 — Oportunidades

- CRUD lógico;
- stage;
- pipeline/list;
- source activity;
- metrics.

**DONE cuando:** un resultado comercial puede convertirse en oportunidad y seguirse hasta ganado/perdido.

---

## Fase 8 — Dashboard

- KPIs;
- actividad;
- funnel;
- categorías;
- ciudades;
- tareas;
- gira activa.

**DONE cuando:** Dirección puede entender el estado comercial sin abrir el Excel.

---

## Fase 9 — PWA + robustez

- manifest;
- installability;
- offline indicator;
- draft persistence;
- responsive QA;
- error recovery;
- performance pass.

**DONE cuando:** se puede instalar en Android/desktop y usar cómodamente en campo.

---

# 46. Definition of Done global

No considerar V1 terminada hasta cumplir:

## Datos

- [ ] 287 prospectos importados.
- [ ] IDs externos preservados.
- [ ] 162 A / 110 B / 15 C.
- [ ] ningún registro duplicado por reimportación.
- [ ] JSON original preservado.

## Seguridad

- [ ] auth operativo.
- [ ] RLS activo.
- [ ] roles testeados.
- [ ] service role fuera del cliente.

## Comercial

- [ ] registrar visita.
- [ ] registrar llamada.
- [ ] agregar nota.
- [ ] resultado.
- [ ] próximo paso.
- [ ] responsable.
- [ ] comentarios Dirección.
- [ ] oportunidad.

## Gira

- [ ] crear gira.
- [ ] seleccionar prospectos.
- [ ] ordenar.
- [ ] abrir navegación.
- [ ] marcar visita.
- [ ] saltar con motivo.
- [ ] ver progreso.
- [ ] pasar al siguiente prospecto.

## Mobile

- [ ] route mode usable con una mano.
- [ ] botones sin scroll horizontal.
- [ ] campos no se cortan.
- [ ] formularios no pierden datos en fallo de red.
- [ ] PWA instalable.

## Dirección

- [ ] dashboard.
- [ ] comentarios.
- [ ] tareas asignables.
- [ ] oportunidades visibles.
- [ ] seguimiento vencido visible.

## Calidad

- [ ] lint limpio.
- [ ] typecheck limpio.
- [ ] tests críticos verdes.
- [ ] Playwright flujos críticos verdes.
- [ ] README actualizado.

---

# 47. Datos que NO deben perderse

Aunque no se muestren siempre en la UI, conservar:

```text
Fuente
URL fuente
Evidencia
Calidad del dato
Origen del registro
Rubro foco enriquecimiento
Ciudad foco solicitada
Observación servicio nuevo
Fuente unificación
Notas de unificación
```

Son importantes para trazabilidad del trabajo de prospección y enriquecimiento.

---

# 48. Feature futura: reimportación controlada

Dejar preparado para futuros Excels actualizados.

La reimportación debe:

- insertar IDs nuevos;
- actualizar campos maestros permitidos;
- no destruir historial;
- no borrar contactos creados en CRM;
- no borrar tareas;
- no borrar actividades;
- no borrar comentarios;
- no borrar oportunidades;
- generar reporte de diferencias.

Posible modo futuro:

```text
Preview changes
+ 12 prospectos
~ 38 actualizaciones
= 249 sin cambios
! 3 conflictos
```

No es necesario UI en V1; sí mantener importador idempotente.

---

# 49. Feature futura: cotizaciones

Arquitectura futura:

```text
opportunity
  ↓
quote
  ↓
quote_items
  ↓
PDF / enviado / aprobado / rechazado
```

No implementar aún, pero no mezclar oportunidad con cotización para no bloquear esta evolución.

---

# 50. Feature futura: WhatsApp

V1:

```text
wa.me deep link
```

Futuro:

- templates;
- API oficial;
- historial sincronizado;
- automatizaciones;
- recordatorios.

No construir scraping ni automatización no oficial.

---

# 51. Feature futura: IA

Posibles usos posteriores:

- resumen automático del historial;
- sugerencia de próximo paso;
- priorización dinámica;
- detección de oportunidad desde notas;
- preparación previa a visita;
- resumen diario a Dirección.

No incluir IA en el camino crítico del MVP.

---

# 52. Criterios de calidad del código

- TypeScript strict;
- no `any` innecesario;
- componentes pequeños;
- lógica de negocio fuera de componentes visuales;
- schemas Zod centralizados;
- constantes para statuses;
- no duplicar strings de estado por toda la app;
- funciones de permisos explícitas;
- queries tipadas;
- migrations versionadas;
- errores manejados;
- logs server útiles;
- no secretos en repo;
- no datos demo mezclados con producción.

---

# 53. Constantes compartidas sugeridas

```ts
export const CONTACT_STATUSES = [
  'pending',
  'attempted',
  'contacted',
  'visited',
  'follow_up',
  'opportunity',
  'customer',
  'not_interested',
  'discarded',
] as const;

export const ACTIVITY_TYPES = [
  'visit',
  'call',
  'whatsapp',
  'email',
  'meeting',
  'note',
  'other',
] as const;

export const ACTIVITY_OUTCOMES = [
  'contacted',
  'no_answer',
  'decision_maker_unavailable',
  'interested',
  'quote_requested',
  'follow_up_required',
  'not_interested',
  'wrong_contact',
  'data_updated',
  'opportunity_detected',
  'other',
] as const;
```

Generar labels en español desde un mapa central.

---

# 54. Ejemplo de flujo real

## Antes del viaje

Dirección/comercial:

```text
crea “Río Tercero → Oncativo”
selecciona prospectos
ordena visitas
asigna responsable
```

## En ruta

Comercial:

```text
abre Ruta de hoy
ve siguiente empresa
lee Preguntar por + necesidad probable + gancho
abre Maps
llega
registra visita
marca “Interesado”
anota “Mueven 5 equipos mensuales”
crea tarea “Enviar presentación mañana”
guarda
pasa a siguiente empresa
```

## Dirección

Minutos después:

```text
ve nueva visita
comenta:
“Preguntar también por retiros de usados y entregas a concesionarios.”
```

## Día siguiente

Comercial:

```text
abre Tareas
ve “Enviar presentación”
realiza acción
registra WhatsApp/email
marca tarea completada
si aparece negocio concreto → crea oportunidad
```

Todo queda unido al prospecto.

---

# 55. Resultado esperado del producto

Al terminar V1, PRESOL debe poder dejar de utilizar la hoja `Prospectos` como registro diario.

El Excel seguirá siendo:

- origen histórico;
- archivo de respaldo/exportación;
- posible fuente para nuevas importaciones.

Pero la **fuente operativa de verdad** pasa a ser el CRM.

La pregunta “¿qué pasó con esta empresa?” debe responderse desde una sola ficha.

La pregunta “¿qué tenemos que hacer hoy?” debe responderse desde Tareas.

La pregunta “¿cómo viene la gira?” debe responderse desde Ruta/Dashboard.

La pregunta “¿qué oportunidades concretas aparecieron?” debe responderse desde Oportunidades.

---

# 56. Entregables que Antigravity debe producir

Como mínimo:

```text
1. Aplicación Next.js funcional.
2. Proyecto Supabase configurado mediante migrations.
3. RLS implementado.
4. Importador XLSX.
5. Base importada con 287 prospectos.
6. Login + roles.
7. Prospectos + ficha.
8. Actividades + timeline.
9. Comentarios Dirección.
10. Tareas.
11. Giras + route mode.
12. Oportunidades.
13. Dashboard.
14. PWA.
15. Tests críticos.
16. README de instalación/deploy/importación.
17. .env.example.
```

---

# 57. Orden de trabajo recomendado para Antigravity

No intentar construir todo simultáneamente.

Seguir este orden:

```text
1 Bootstrap
2 Supabase/Auth/RLS
3 Schema
4 Importador
5 Verificación 287 registros
6 Prospect list/detail
7 Activities
8 Comments
9 Tasks
10 Trips
11 Route mode
12 Opportunities
13 Dashboard
14 PWA
15 Tests/QA
16 Deploy
```

Después de cada bloque:

```text
- correr lint
- correr typecheck
- correr tests relevantes
- corregir antes de avanzar
```

---

# 58. Regla anti-scope-creep

Si aparece una idea nueva durante implementación, clasificar:

```text
BLOCKER        necesaria para que el MVP funcione
V1             ya definida aquí
V1.1           mejora posterior
BACKLOG        futura
```

No interrumpir el camino crítico por features V1.1 o backlog.

---

# 59. Primer objetivo demostrable

El primer milestone realmente útil debe demostrar esto:

```text
1. Login.
2. 287 prospectos importados.
3. Buscar Ascanelli / RT-054.
4. Abrir ficha.
5. Registrar una visita.
6. Agregar resultado y nota.
7. Crear próximo paso.
8. Dirección agrega comentario.
9. Todo aparece cronológicamente en la misma ficha.
```

Si este flujo funciona bien, la arquitectura base está validada.

---

# 60. Segundo objetivo demostrable

```text
1. Crear gira Río Tercero → Oncativo.
2. Seleccionar las empresas correspondientes al recorrido.
3. No incorporar automáticamente Río Tercero como lote de visitas.
4. Incluir Oncativo.
5. Ordenar paradas.
6. Abrir la gira desde celular.
7. Navegar a una empresa.
8. Registrar visita.
9. Ver progreso de gira.
10. Continuar con la siguiente parada.
```

---

# 61. Tercer objetivo demostrable

Dirección abre Dashboard y puede ver:

```text
cantidad visitada
resultados
interesados
oportunidades
seguimientos vencidos
últimas notas de campo
comentarios propios
```

Sin abrir Excel.

---

# 62. Nota final de producto

Este sistema no debe limitarse a almacenar datos.

Su función es convertir la prospección en un proceso operativo:

```text
PREPARAR
→ VISITAR
→ REGISTRAR
→ DECIDIR
→ SEGUIR
→ CONVERTIR
→ MEDIR
```

La experiencia durante el viaje comercial tiene prioridad sobre cualquier feature administrativa secundaria.

**Construir primero el flujo que el comercial usa en la calle.** Luego completar Dirección y reporting sobre la misma estructura de datos.

