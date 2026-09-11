# PRESOL Cost Engine v1.0
## Especificación de implementación para CRM + Supabase

**Proyecto:** PRESOL — Cotizador de transporte y operaciones  
**Documento:** Especificación técnica para implementación en Antigravity  
**Versión:** 1.0  
**Fecha base:** 2026-09-10  
**Fuente funcional:** `PRESOL_Cotizador_Transporte_v3_Activos_Configuraciones.xlsx`

---

# 0. OBJETIVO

Implementar dentro del CRM de PRESOL un módulo de cotización de viajes y operaciones que replique y evolucione la lógica validada en el Excel V3.

El sistema debe permitir:

1. Administrar activos físicos: camiones, tractor, carretón, vehículo guía y futuros equipos.
2. Administrar costos de personal por separado de los activos.
3. Crear configuraciones operativas combinando activos + personal.
4. Calcular costo variable por km y costo fijo por hora de cada configuración.
5. Cotizar transporte, hidrogrúa, malacate, espera, peajes, permisos, custodia, guía, viáticos y otros.
6. Aplicar contingencia, margen objetivo y tarifa mínima.
7. Validar capacidad, dimensiones y compatibilidad de servicios.
8. Permitir un precio final comercial editable, mostrando su margen real.
9. Guardar un snapshot completo de los costos y reglas usados en cada cotización.
10. Convertir una cotización aceptada en viaje.
11. Registrar costos reales del viaje.
12. Comparar margen estimado vs. margen real.
13. Alimentar futuros dashboards de rentabilidad por cliente, configuración y tipo de servicio.

El módulo debe quedar preparado para crecer sin rehacer el motor de cálculo.

---

# 1. REGLAS NO NEGOCIABLES

## 1.1 No hardcodear costos

Ningún costo operativo debe quedar escrito directamente en componentes React, páginas, hooks ni fórmulas del frontend.

Todos los valores deben provenir de Supabase:

- combustible $/km;
- neumáticos $/km;
- mantenimiento $/km;
- lubricantes $/km;
- seguros;
- patente/habilitaciones;
- estructura;
- depreciación/capital;
- otros costos fijos;
- costo empresa de personal;
- horas productivas;
- hidrogrúa;
- malacate;
- espera;
- contingencia;
- tarifa mínima;
- márgenes;
- límites de control;
- validez de cotización.

---

## 1.2 El frontend NO es la fuente de verdad del cálculo

El navegador puede:

- capturar inputs;
- mostrar resultados;
- recalcular una vista preliminar si fuera necesario para UX.

Pero el cálculo oficial que se guarda en la base debe ejecutarse del lado servidor.

### Preferencia

Crear un módulo `server-only` de TypeScript:

```text
src/lib/presol-cost-engine/
```

La función central debe ser pura, testeable y versionada.

Si el CRM actual ya usa Supabase RPC/Postgres functions como patrón dominante, puede implementarse allí, pero no crear dos motores de cálculo paralelos.

**Debe existir una única fuente de verdad.**

---

## 1.3 No duplicar costos

Reglas críticas:

- El chofer NO pertenece al tractor ni al carretón.
- El chofer se asigna una sola vez a la configuración.
- Combustible pertenece a costos variables por km.
- Seguro, patente y depreciación pertenecen a costos fijos.
- La espera no debe cobrarse simultáneamente como hora base y como hora de espera.
- Viáticos extraordinarios se cargan por cotización/viaje.
- Si un vehículo guía está incorporado como activo de la configuración, no volver a cargar su costo como gasto externo.

---

## 1.4 Snapshots obligatorios

Una cotización emitida no debe cambiar si mañana cambian:

- combustible;
- salarios;
- seguros;
- márgenes;
- configuración;
- tarifa mínima;
- cualquier otro parámetro.

Cada cotización debe conservar una copia exacta de:

- versión del motor;
- configuración utilizada;
- costos de sus activos;
- costos de personal;
- parámetros comerciales;
- reglas de margen;
- inputs;
- resultado completo.

---

## 1.5 Los costos ilustrativos NO son costos reales PRESOL

Los seed iniciales derivados del Excel V3 deben cargarse con:

```text
is_assumption = true
```

y una nota explícita:

```text
SUPUESTO ILUSTRATIVO — reemplazar por dato real PRESOL.
```

No presentar estos valores en UI como costos validados.

---

# 2. ANTES DE MODIFICAR EL CRM

Antigravity debe primero inspeccionar el proyecto actual.

## Checklist obligatorio

1. Leer `package.json`.
2. Identificar framework y versión.
3. Identificar estructura `src/`.
4. Identificar sistema de autenticación actual.
5. Identificar cliente Supabase actual.
6. Revisar migraciones existentes.
7. Localizar tabla de clientes/prospectos existente.
8. Localizar sistema de roles/permisos.
9. Revisar componentes UI y design system.
10. Revisar convenciones de rutas, formularios y validación.
11. Revisar si ya existen tablas `quotes`, `trips`, `vehicles`, `clients` o equivalentes.
12. No duplicar entidades existentes.

### Importante

Este documento propone nombres canónicos.

Si el CRM ya tiene una entidad equivalente, **integrarse con ella** en lugar de crear una tabla duplicada.

Ejemplo:

```text
Si existe crm_clients -> usar crm_clients.
NO crear clients nuevamente.
```

No migrar el framework ni rehacer el CRM.

---

# 3. MODELO CONCEPTUAL

```text
CLIENTE
   │
   └── COTIZACIÓN
          │
          ├── CONFIGURACIÓN OPERATIVA
          │      │
          │      ├── ACTIVOS
          │      │      ├── Atego
          │      │      ├── Tractor
          │      │      ├── Carretón
          │      │      └── Vehículo guía
          │      │
          │      └── PERSONAL
          │             ├── Chofer
          │             └── Operador / acompañante
          │
          ├── RUTA
          ├── CARGA
          ├── SERVICIOS
          ├── COSTOS EXTERNOS
          ├── CÁLCULO
          └── SNAPSHOT
                 │
                 └── si ACEPTADA
                        │
                        └── VIAJE
                               │
                               ├── km reales
                               ├── horas reales
                               ├── gastos reales
                               └── margen real
```

---

# 4. ESTRUCTURA DE BASE DE DATOS

Usar UUID como PK salvo que el proyecto ya tenga otra convención.

Todos los importes monetarios:

```sql
numeric(16,2)
```

Distancias y horas:

```sql
numeric(12,2)
```

Porcentajes guardados como fracción:

```text
0.30 = 30%
```

Usar:

```sql
numeric(8,6)
```

No usar `float` para dinero.

---

# 5. TABLA: cost_engine_versions

Registra la versión lógica utilizada.

```sql
create table if not exists cost_engine_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

Seed inicial:

```text
PRESOL-COST-1.0
```

---

# 6. TABLA: assets

Representa activos físicos.

```sql
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null,
  asset_type text not null,

  capacity_kg numeric(12,2),

  fuel_cost_per_km numeric(16,2) not null default 0,
  tire_cost_per_km numeric(16,2) not null default 0,
  maintenance_cost_per_km numeric(16,2) not null default 0,
  lubricant_cost_per_km numeric(16,2) not null default 0,

  insurance_monthly numeric(16,2) not null default 0,
  permits_tax_monthly numeric(16,2) not null default 0,
  structure_monthly numeric(16,2) not null default 0,
  depreciation_capital_monthly numeric(16,2) not null default 0,
  other_fixed_monthly numeric(16,2) not null default 0,

  productive_hours_monthly numeric(12,2),

  supports_crane boolean not null default false,
  supports_winch boolean not null default false,

  is_active boolean not null default true,
  is_assumption boolean not null default true,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assets_productive_hours_positive
    check (productive_hours_monthly is null or productive_hours_monthly > 0)
);
```

---

# 7. CÁLCULOS DERIVADOS DE ACTIVO

No es necesario guardar estos valores físicamente si se calculan en el motor.

## Variable total por km

```text
asset_variable_cost_per_km =
    fuel_cost_per_km
  + tire_cost_per_km
  + maintenance_cost_per_km
  + lubricant_cost_per_km
```

## Fijo mensual total

```text
asset_fixed_monthly =
    insurance_monthly
  + permits_tax_monthly
  + structure_monthly
  + depreciation_capital_monthly
  + other_fixed_monthly
```

## Costo fijo activo / hora

```text
asset_fixed_cost_per_hour =
  asset_fixed_monthly / productive_hours_monthly
```

Si `productive_hours_monthly <= 0`:

```text
CONFIGURACIÓN INCOMPLETA
```

No permitir emitir cotización.

---

# 8. TABLA: personnel_costs

```sql
create table if not exists personnel_costs (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  role_name text not null,

  employer_monthly_cost numeric(16,2) not null default 0,
  productive_hours_monthly numeric(12,2) not null,

  is_active boolean not null default true,
  is_assumption boolean not null default true,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint personnel_productive_hours_positive
    check (productive_hours_monthly > 0)
);
```

Costo hora:

```text
personnel_cost_per_hour =
  employer_monthly_cost / productive_hours_monthly
```

---

# 9. TABLA: configurations

Una configuración representa el conjunto real que sale a trabajar.

```sql
create table if not exists configurations (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null,

  capacity_kg numeric(12,2),

  supports_crane boolean not null default false,
  supports_winch boolean not null default false,

  is_active boolean not null default true,
  is_assumption boolean not null default true,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint configurations_capacity_nonnegative
    check (capacity_kg is null or capacity_kg >= 0)
);
```

### Importante

La capacidad de una configuración **NO se obtiene sumando capacidades de activos**.

Debe cargarse explícitamente según el límite técnico/legal real de la combinación.

Ejemplo:

```text
Tractor + carretón
```

La capacidad operativa no es:

```text
capacidad tractor + capacidad carretón
```

Es un dato específico de la configuración.

---

# 10. TABLA: configuration_assets

Relación N:N.

```sql
create table if not exists configuration_assets (
  configuration_id uuid not null
    references configurations(id) on delete cascade,

  asset_id uuid not null
    references assets(id) on delete restrict,

  quantity numeric(8,2) not null default 1,

  primary key (configuration_id, asset_id)
);
```

MVP: `quantity = 1`.

Mantener el campo para permitir futuras configuraciones con múltiples activos equivalentes.

---

# 11. TABLA: configuration_personnel

```sql
create table if not exists configuration_personnel (
  configuration_id uuid not null
    references configurations(id) on delete cascade,

  personnel_cost_id uuid not null
    references personnel_costs(id) on delete restrict,

  quantity numeric(8,2) not null default 1,

  primary key (configuration_id, personnel_cost_id)
);
```

Ejemplo:

```text
CFG-03 Tractor + Carretón
  Activos:
    Tractor x1
    Carretón x1

  Personal:
    Chofer tractor + carretón x1
```

No agregar un chofer al tractor y otro al carretón salvo que realmente sean dos personas.

---

# 12. CÁLCULO DE CONFIGURACIÓN

## Costo variable total / km

```text
configuration_variable_cost_per_km =
  SUM(asset_variable_cost_per_km * quantity)
```

## Costo fijo activos / hora

```text
configuration_assets_fixed_cost_per_hour =
  SUM(asset_fixed_cost_per_hour * quantity)
```

## Costo personal / hora

```text
configuration_personnel_cost_per_hour =
  SUM(personnel_cost_per_hour * quantity)
```

## Costo fijo total / hora

```text
configuration_fixed_cost_per_hour =
    configuration_assets_fixed_cost_per_hour
  + configuration_personnel_cost_per_hour
```

---

# 13. TABLA: pricing_parameters

Tabla genérica para parámetros comerciales/operativos.

```sql
create table if not exists pricing_parameters (
  id uuid primary key default gen_random_uuid(),

  key text not null unique,
  label text not null,

  numeric_value numeric(16,6),
  text_value text,
  unit text,

  category text not null,

  is_active boolean not null default true,
  is_assumption boolean not null default true,

  notes text,

  updated_at timestamptz not null default now(),
  updated_by uuid
);
```

---

# 14. PARÁMETROS INICIALES

Cargar como seed, todos marcados como supuestos salvo que PRESOL los haya validado.

```text
crane_hour_cost               65000       $/h
crane_min_hours               1           h
winch_hour_cost               30000       $/h
winch_min_hours               1           h
waiting_hour_cost             25000       $/h
standard_contingency          0.04        ratio
standard_margin               0.30        ratio
minimum_authorized_margin     0.20        ratio
minimum_service_price         350000      $
quote_validity_days           7           days
average_speed_kmh             60          km/h
max_width_control_m           2.60        m
max_height_control_m          4.30        m
```

La capacidad no debe obtenerse de un parámetro global cuando exista una configuración seleccionada.

Debe prevalecer:

```text
configuration.capacity_kg
```

---

# 15. TABLA: operation_margin_rules

```sql
create table if not exists operation_margin_rules (
  id uuid primary key default gen_random_uuid(),

  operation_type text not null unique,
  margin_ratio numeric(8,6) not null,

  is_active boolean not null default true,
  is_assumption boolean not null default true,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_margin
    check (margin_ratio >= 0 and margin_ratio < 1)
);
```

Seed:

```text
Transporte estándar       0.28
Transporte + hidrogrúa    0.33
Trabajo complejo          0.38
Transporte recurrente     0.23
Urgencia                  0.40
```

Todos inicialmente:

```text
is_assumption = true
```

---

# 16. TABLA: quotes

Adaptar `client_id` a la tabla de clientes existente.

```sql
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),

  quote_number text not null unique,

  client_id uuid,
  contact_name text,

  operation_type text not null,
  configuration_id uuid not null
    references configurations(id),

  status text not null default 'draft',

  quote_date date not null default current_date,
  valid_until date,

  base_location text,
  pickup_location text,
  delivery_location text,

  km_base_to_pickup numeric(12,2) not null default 0,
  km_pickup_to_delivery numeric(12,2) not null default 0,
  km_delivery_to_base numeric(12,2) not null default 0,

  loading_hours numeric(12,2) not null default 0,
  unloading_hours numeric(12,2) not null default 0,
  waiting_hours numeric(12,2) not null default 0,
  transfer_hours numeric(12,2),

  cargo_type text,
  cargo_description text,

  cargo_weight_kg numeric(12,2) not null default 0,
  cargo_length_m numeric(12,2) not null default 0,
  cargo_width_m numeric(12,2) not null default 0,
  total_transport_height_m numeric(12,2) not null default 0,

  crane_loading boolean not null default false,
  crane_unloading boolean not null default false,
  crane_hours numeric(12,2) not null default 0,

  winch_used boolean not null default false,
  winch_hours numeric(12,2) not null default 0,

  tolls_amount numeric(16,2) not null default 0,
  permits_escort_guide_amount numeric(16,2) not null default 0,
  travel_lodging_other_amount numeric(16,2) not null default 0,

  target_margin_ratio numeric(8,6),

  estimated_cost numeric(16,2),
  technical_price numeric(16,2),
  recommended_price numeric(16,2),
  final_price numeric(16,2),
  final_margin_amount numeric(16,2),
  final_margin_ratio numeric(8,6),

  operational_status text,
  margin_status text,

  calculation_version text,

  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

# 17. ESTADOS DE COTIZACIÓN

Usar check constraint, enum existente o equivalente según patrón del CRM.

Estados mínimos:

```text
draft
calculated
sent
accepted
rejected
expired
cancelled
```

Workflow:

```text
draft
  ↓
calculated
  ↓
sent
  ├── accepted
  ├── rejected
  └── expired
```

No convertir a viaje una cotización `rejected`, `expired` o `cancelled`.

---

# 18. NUMERACIÓN DE COTIZACIONES

Formato:

```text
PRE-2026-0001
PRE-2026-0002
...
```

La numeración debe generarse del lado servidor / base de datos.

No calcular:

```text
COUNT(*) + 1
```

porque genera colisiones.

Implementar secuencia o tabla contador transaccional.

Ejemplo de estrategia:

```text
year + sequence
```

Mantener número inmutable una vez asignado.

---

# 19. TABLA: quote_cost_snapshots

Esta tabla es CRÍTICA.

```sql
create table if not exists quote_cost_snapshots (
  id uuid primary key default gen_random_uuid(),

  quote_id uuid not null unique
    references quotes(id) on delete cascade,

  cost_engine_version_id uuid
    references cost_engine_versions(id),

  engine_code text not null,

  configuration_snapshot jsonb not null,
  assets_snapshot jsonb not null,
  personnel_snapshot jsonb not null,
  parameters_snapshot jsonb not null,
  margin_rule_snapshot jsonb not null,
  input_snapshot jsonb not null,
  calculation_snapshot jsonb not null,

  created_at timestamptz not null default now()
);
```

El snapshot se crea cuando:

```text
cotización pasa de draft -> calculated
```

o al emitirla por primera vez.

Si se edita una cotización después de calculada:

### Opción recomendada MVP

Crear nueva revisión de cotización antes de enviarla.

Si se permite recalcular sobre la misma cotización mientras sigue en `draft`, reemplazar snapshot.

Una vez `sent`, nunca sobrescribir el snapshot original.

---

# 20. SNAPSHOT MÍNIMO DE CONFIGURACIÓN

Ejemplo conceptual:

```json
{
  "id": "...",
  "code": "CFG-03",
  "name": "Tractor + carretón",
  "capacityKg": 30000,
  "supportsCrane": false,
  "supportsWinch": false,
  "variableCostPerKm": 2860,
  "assetsFixedCostPerHour": 25000,
  "personnelCostPerHour": 10000,
  "fixedCostPerHour": 35000
}
```

---

# 21. MOTOR DE CÁLCULO

Crear:

```text
src/lib/presol-cost-engine/calculate-quote.ts
```

Debe ser una función pura.

Ejemplo de firma:

```ts
type CalculateQuoteInput = {
  configuration: ConfigurationCostSnapshot
  parameters: PricingParametersSnapshot
  operationMargin: number

  route: {
    kmBaseToPickup: number
    kmPickupToDelivery: number
    kmDeliveryToBase: number
  }

  time: {
    loadingHours: number
    unloadingHours: number
    waitingHours: number
    transferHours?: number
  }

  cargo: {
    weightKg: number
    lengthM: number
    widthM: number
    totalTransportHeightM: number
  }

  services: {
    craneLoading: boolean
    craneUnloading: boolean
    craneHours: number
    winchUsed: boolean
    winchHours: number
  }

  externalCosts: {
    tolls: number
    permitsEscortGuide: number
    travelLodgingOther: number
  }

  finalSellerPrice?: number
}
```

Retorno:

```ts
type QuoteCalculationResult = {
  totalKm: number
  suggestedTransferHours: number
  usedTransferHours: number

  distanceCost: number
  baseTimeCost: number
  waitingCost: number
  craneCost: number
  winchCost: number
  tollsCost: number
  permitsEscortGuideCost: number
  travelLodgingOtherCost: number

  operatingSubtotal: number
  contingencyRatio: number
  contingencyAmount: number
  estimatedTotalCost: number

  targetMarginRatio: number
  technicalPrice: number
  minimumServicePrice: number
  recommendedPrice: number

  finalPrice: number
  finalMarginAmount: number
  finalMarginRatio: number

  marginStatus: "OK" | "REQUIRES_AUTHORIZATION"
  operationalStatus: "NORMAL" | "REVIEW_REQUIRED"

  controls: {
    configurationReady: boolean
    weightOk: boolean
    dimensionsOk: boolean
    craneCompatible: boolean
    winchCompatible: boolean
    messages: string[]
  }
}
```

---

# 22. FÓRMULAS EXACTAS

## 22.1 Km totales

```text
total_km =
    km_base_to_pickup
  + km_pickup_to_delivery
  + km_delivery_to_base
```

No ignorar retorno vacío.

---

## 22.2 Horas de traslado sugeridas

```text
suggested_transfer_hours =
  total_km / average_speed_kmh
```

Si el usuario ingresa horas de traslado manuales válidas:

```text
used_transfer_hours = transfer_hours_manual
```

Si no:

```text
used_transfer_hours = suggested_transfer_hours
```

Guardar ambos.

---

## 22.3 Horas base

La espera se calcula por separado.

```text
base_hours =
    loading_hours
  + unloading_hours
  + used_transfer_hours
```

NO sumar `waiting_hours` aquí.

---

## 22.4 Costo por distancia

```text
distance_cost =
  total_km * configuration_variable_cost_per_km
```

---

## 22.5 Costo de tiempo base

```text
base_time_cost =
  base_hours * configuration_fixed_cost_per_hour
```

---

## 22.6 Costo de espera

```text
waiting_cost =
  waiting_hours * waiting_hour_cost
```

La espera no se vuelve a incluir en `base_time_cost`.

---

## 22.7 Hidrogrúa

Si:

```text
crane_loading = true
OR
crane_unloading = true
```

entonces:

```text
billable_crane_hours =
  MAX(crane_hours, crane_min_hours)

crane_cost =
  billable_crane_hours * crane_hour_cost
```

Si no se utiliza:

```text
crane_cost = 0
```

---

## 22.8 Malacate

Si:

```text
winch_used = true
```

entonces:

```text
billable_winch_hours =
  MAX(winch_hours, winch_min_hours)

winch_cost =
  billable_winch_hours * winch_hour_cost
```

Si no:

```text
winch_cost = 0
```

---

## 22.9 Subtotal operativo

```text
operating_subtotal =
    distance_cost
  + base_time_cost
  + waiting_cost
  + crane_cost
  + winch_cost
  + tolls
  + permits_escort_guide
  + travel_lodging_other
```

---

## 22.10 Contingencia

```text
contingency_amount =
  operating_subtotal * contingency_ratio
```

---

## 22.11 Costo total estimado

```text
estimated_total_cost =
  operating_subtotal + contingency_amount
```

---

## 22.12 Precio técnico por margen

IMPORTANTE: margen sobre precio de venta.

```text
technical_price =
  estimated_total_cost / (1 - target_margin_ratio)
```

No usar:

```text
estimated_total_cost * (1 + margin)
```

porque eso es markup, no margen.

---

## 22.13 Precio recomendado

```text
recommended_price =
  MAX(
    technical_price,
    minimum_service_price
  )
```

---

## 22.14 Precio final vendedor

Por defecto:

```text
final_price = recommended_price
```

El vendedor puede modificarlo si su rol lo permite.

---

## 22.15 Margen final

```text
final_margin_amount =
  final_price - estimated_total_cost
```

```text
final_margin_ratio =
  final_margin_amount / final_price
```

Si `final_price <= 0`, devolver error de validación.

---

# 23. CONTROL DE MARGEN

Si:

```text
final_margin_ratio >= minimum_authorized_margin
```

mostrar:

```text
OK
```

Si:

```text
final_margin_ratio < minimum_authorized_margin
```

mostrar:

```text
REQUIERE AUTORIZACIÓN
```

Idealmente:

- vendedor puede calcular;
- vendedor no puede marcar `sent` sin autorización;
- administrador/comercial autorizado puede aprobar precio.

Si el CRM todavía no tiene workflow de aprobación, MVP:

1. mostrar alerta roja;
2. bloquear estado `sent`;
3. permitir override sólo a rol administrador.

---

# 24. CONTROLES OPERATIVOS

## 24.1 Configuración lista

Debe cumplirse:

```text
configuration.is_active = true
configuration.capacity_kg > 0
configuration.variable_cost_per_km >= 0
configuration.fixed_cost_per_hour > 0
```

Si no:

```text
REVIEW_REQUIRED
```

y bloquear emisión.

---

## 24.2 Peso

```text
weight_ok =
  cargo_weight_kg <= configuration.capacity_kg
```

Si no:

```text
PESO SUPERA CAPACIDAD CONFIGURADA
```

Bloquear emisión salvo revisión/autorización técnica explícita.

---

## 24.3 Ancho

Si:

```text
cargo_width_m > max_width_control_m
```

mostrar:

```text
REVISAR ANCHO / PERMISOS / CONFIGURACIÓN
```

No asumir automáticamente ilegalidad.

Es una alerta técnica/documental.

---

## 24.4 Altura total transportada

Si:

```text
total_transport_height_m > max_height_control_m
```

mostrar:

```text
REVISAR ALTURA TOTAL / RUTA / PERMISOS
```

---

## 24.5 Hidrogrúa

Si se solicita hidrogrúa:

```text
crane_loading = true
OR
crane_unloading = true
```

y:

```text
configuration.supports_crane = false
```

mostrar:

```text
CONFIGURACIÓN NO COMPATIBLE CON HIDROGRÚA
```

No emitir como operación normal.

---

## 24.6 Malacate

Si:

```text
winch_used = true
```

y:

```text
configuration.supports_winch = false
```

mostrar:

```text
CONFIGURACIÓN NO COMPATIBLE CON MALACATE
```

---

# 25. ESTADO OPERATIVO FINAL

```text
NORMAL
```

sólo si todos los controles críticos pasan.

En cualquier otro caso:

```text
REVIEW_REQUIRED
```

Además devolver un array de mensajes específicos.

No usar una única alerta genérica.

---

# 26. PRECISIÓN NUMÉRICA

No hacer cálculos de dinero con `number` de JavaScript si puede evitarse.

Preferencia:

```text
decimal.js
```

o librería decimal ya existente en el proyecto.

Redondear sólo al presentar.

Internamente conservar al menos:

```text
2 decimales para moneda
4-6 para ratios
```

---

# 27. ESTRUCTURA DE CÓDIGO PROPUESTA

Si el proyecto es Next.js/App Router, adaptar a:

```text
src/
├── app/
│   └── crm/
│       └── cotizaciones/
│           ├── page.tsx
│           ├── nueva/
│           │   └── page.tsx
│           └── [id]/
│               └── page.tsx
│
├── components/
│   └── presol/
│       └── quotes/
│           ├── QuoteForm.tsx
│           ├── QuoteSummary.tsx
│           ├── RouteSection.tsx
│           ├── CargoSection.tsx
│           ├── ServicesSection.tsx
│           ├── CostBreakdown.tsx
│           ├── OperationalChecks.tsx
│           └── MarginIndicator.tsx
│
├── lib/
│   └── presol-cost-engine/
│       ├── calculate-quote.ts
│       ├── validators.ts
│       ├── types.ts
│       ├── repository.ts
│       ├── snapshots.ts
│       └── constants.ts
│
└── actions/
    └── quotes/
        ├── calculateQuote.ts
        ├── createQuote.ts
        ├── updateQuote.ts
        ├── sendQuote.ts
        └── convertQuoteToTrip.ts
```

Si el proyecto actual usa otra arquitectura, respetarla.

NO crear esta estructura literalmente si rompe las convenciones existentes.

---

# 28. VALIDACIÓN

Usar Zod si ya está presente.

Ejemplo conceptual:

```ts
const quoteInputSchema = z.object({
  configurationId: z.string().uuid(),

  kmBaseToPickup: z.number().min(0),
  kmPickupToDelivery: z.number().min(0),
  kmDeliveryToBase: z.number().min(0),

  loadingHours: z.number().min(0),
  unloadingHours: z.number().min(0),
  waitingHours: z.number().min(0),

  cargoWeightKg: z.number().min(0),
  cargoLengthM: z.number().min(0),
  cargoWidthM: z.number().min(0),
  totalTransportHeightM: z.number().min(0),

  craneHours: z.number().min(0),
  winchHours: z.number().min(0),

  tolls: z.number().min(0),
  permitsEscortGuide: z.number().min(0),
  travelLodgingOther: z.number().min(0)
})
```

---

# 29. UI — NUEVA COTIZACIÓN

Ruta sugerida:

```text
/crm/cotizaciones/nueva
```

## Desktop

Layout 2 columnas.

```text
┌───────────────────────────────────────┬──────────────────────────┐
│ FORMULARIO                            │ RESUMEN                  │
│                                       │                          │
│ Cliente                               │ Costo estimado           │
│ Operación                             │ Precio técnico           │
│ Configuración                         │ Precio recomendado       │
│ Ruta                                  │ Precio final             │
│ Carga                                 │ Margen                   │
│ Servicios                             │                          │
│ Gastos                                │ Controles operativos     │
│                                       │                          │
└───────────────────────────────────────┴──────────────────────────┘
```

El resumen de la derecha debe permanecer visible/sticky si el design system lo permite.

---

# 30. FORMULARIO — SECCIONES

## 30.1 Datos comerciales

- cliente;
- contacto;
- tipo de operación;
- configuración;
- fecha;
- validez;
- estado.

---

## 30.2 Ruta

Campos:

```text
Base / salida
Origen / retiro
Destino / entrega

Km base → retiro
Km retiro → entrega
Km entrega → base
```

Mostrar:

```text
Km totales
```

automáticamente.

### MVP

Los km son manuales.

No integrar Google Maps/Mapbox/Distance Matrix en la primera implementación salvo que ya exista infraestructura reutilizable y no agregue costo/dependencia.

Diseñar interfaz para poder agregar un proveedor de rutas en Fase 2.

---

# 31. TIEMPOS

Campos:

```text
Horas carga
Horas descarga
Horas espera
Horas traslado
```

Mostrar:

```text
Traslado sugerido:
total_km / average_speed
```

Permitir editar `Horas traslado`.

Distinguir visualmente:

```text
Sugerido
Manual
```

---

# 32. CARGA

Campos:

```text
Tipo de carga
Descripción
Peso kg
Largo m
Ancho m
Altura total en transporte m
```

Aclaración UI:

```text
Altura total en transporte = altura final del conjunto cargado.
```

No confundir con altura de la pieza aislada.

---

# 33. SERVICIOS

Controles:

```text
[ ] Carga con hidrogrúa
[ ] Descarga con hidrogrúa
Horas hidrogrúa

[ ] Uso de malacate
Horas malacate
```

Si el servicio se activa y las horas están debajo del mínimo:

mostrar:

```text
Se aplicará mínimo de X h
```

---

# 34. GASTOS EXTERNOS

Campos monetarios:

```text
Peajes
Permisos / custodia / vehículo guía
Viáticos / pernocte / otros
```

Agregar campo de nota/descripción opcional si la UI lo permite.

---

# 35. PANEL DE CÁLCULO INTERNO

Mostrar exclusivamente a usuarios autorizados.

```text
Costo variable / km configuración
Costo distancia
Costo tiempo base
Costo espera
Costo hidrogrúa
Costo malacate
Peajes
Permisos / custodia / guía
Viáticos / pernocte / otros
────────────────────────────
Subtotal operativo
Contingencia %
Contingencia $
Costo total estimado
```

Después:

```text
Margen objetivo
Precio técnico
Tarifa mínima
PRECIO RECOMENDADO
```

---

# 36. PRECIO FINAL

Campo:

```text
Precio final vendedor
```

Inicializar con:

```text
recommended_price
```

Si se modifica, recalcular instantáneamente:

```text
Margen $
Margen %
Semáforo margen
```

No alterar los costos internos al cambiar precio final.

---

# 37. SEMÁFORO

## Verde

```text
Margen >= mínimo autorizado
Operación normal
```

## Amarillo

```text
Revisión técnica/documental
```

## Rojo

```text
Margen debajo del mínimo
o
configuración inválida
o
capacidad excedida
```

Usar componentes visuales existentes del CRM.

No introducir una nueva paleta si ya hay design system.

---

# 38. DETALLE DE CONFIGURACIÓN EN UI

Al seleccionar:

```text
CFG-03 · Tractor + carretón
```

mostrar un resumen compacto:

```text
Capacidad configurada      30.000 kg
Costo variable             $2.860/km
Costo fijo                 $35.000/h
Hidrogrúa                   No
Malacate                    No
Estado datos                LISTA / SUPUESTO
```

Si contiene datos ilustrativos:

```text
⚠ Contiene costos aún no validados por PRESOL
```

---

# 39. ADMINISTRACIÓN — ACTIVOS

Ruta sugerida:

```text
/crm/configuracion/costos/activos
```

CRUD:

- crear;
- editar;
- activar/desactivar;
- no borrar físicamente si ya fue utilizado en cotizaciones.

Mostrar:

```text
Código
Activo
Tipo
Capacidad
Variable $/km
Fijo mensual
Horas productivas
Fijo $/h
Estado
```

---

# 40. ADMINISTRACIÓN — PERSONAL

Ruta:

```text
/crm/configuracion/costos/personal
```

Campos:

```text
Código
Rol
Costo empresa mensual
Horas productivas
Costo/h calculado
Activo
Notas
```

---

# 41. ADMINISTRACIÓN — CONFIGURACIONES

Ruta:

```text
/crm/configuracion/costos/configuraciones
```

Permitir:

1. crear configuración;
2. asociar N activos;
3. asociar N roles/personas tipo;
4. definir capacidad;
5. indicar hidrogrúa;
6. indicar malacate;
7. activar/desactivar;
8. mostrar costos calculados.

Panel:

```text
VARIABLE TOTAL $/KM
FIJO ACTIVOS $/H
PERSONAL $/H
FIJO TOTAL $/H
```

---

# 42. ADMINISTRACIÓN — PARÁMETROS

Ruta:

```text
/crm/configuracion/costos/parametros
```

Agrupar:

### Servicios

- hidrogrúa;
- mínimo hidrogrúa;
- malacate;
- mínimo malacate;
- espera.

### Comercial

- contingencia;
- margen estándar;
- margen mínimo;
- tarifa mínima;
- validez.

### Operativo

- velocidad media;
- ancho alerta;
- altura alerta.

### Márgenes por operación

tabla editable.

---

# 43. PERMISOS

Integrarse al sistema de roles actual.

Roles conceptuales:

```text
ADMIN
COMERCIAL
LECTURA
```

No crear roles nuevos si ya existen equivalentes.

## ADMIN

Puede:

- editar costos;
- editar activos;
- editar personal;
- editar configuraciones;
- editar márgenes;
- autorizar precio bajo margen mínimo.

## COMERCIAL

Puede:

- crear cotización;
- calcular;
- editar inputs;
- cambiar precio dentro del rango permitido;
- enviar cotización;
- convertir aceptada a viaje.

No puede:

- cambiar costo/km;
- cambiar salarios;
- cambiar depreciaciones;
- cambiar margen mínimo.

## LECTURA

Sólo consulta.

---

# 44. SEGURIDAD / RLS

Aplicar RLS a todas las nuevas tablas si el proyecto usa RLS.

No copiar literalmente políticas sin inspeccionar el modelo auth actual.

Regla general:

### Costos internos

```text
assets
personnel_costs
pricing_parameters
operation_margin_rules
```

Sólo usuarios autenticados con permiso comercial/admin.

### Mutación de costos

Sólo admin.

### Cotizaciones

Comerciales pueden crear/editar según política CRM.

### Snapshot

No editable manualmente desde cliente.

Insertado únicamente por función/acción servidor.

---

# 45. NO EXPONER COSTOS INTERNOS AL CLIENTE

Si más adelante existe portal público o PDF:

NO incluir:

- costo/km;
- costo/h;
- depreciación;
- salario;
- margen interno;
- contingencia interna;
- costo estimado.

La salida comercial debe mostrar:

```text
Servicio
Descripción
Origen
Destino
Alcance
Precio
IVA
Validez
Condiciones
```

---

# 46. API / SERVER ACTIONS

Adaptar al patrón existente.

Operaciones mínimas:

```text
getConfigurations()
getConfigurationCost(id)

getPricingParameters()
getOperationMargins()

calculateQuote(input)

createQuote(input)
updateDraftQuote(id, input)

markQuoteCalculated(id)
markQuoteSent(id)
acceptQuote(id)
rejectQuote(id)

convertQuoteToTrip(id)
```

La acción `calculateQuote` debe:

1. validar input;
2. cargar configuración desde DB;
3. cargar activos;
4. cargar personal;
5. cargar parámetros;
6. cargar margen;
7. construir snapshot in-memory;
8. ejecutar motor;
9. devolver cálculo.

`createQuote` / `markQuoteCalculated` además persisten snapshot.

---

# 47. TRANSACCIÓN AL EMITIR

Cuando se confirma una cotización:

Realizar dentro de una operación consistente:

```text
1. generar número
2. insertar/actualizar quote
3. calcular con valores actuales
4. crear snapshot
5. guardar resultados derivados
6. commit
```

Si falla snapshot:

```text
NO marcar como calculada/enviada
```

---

# 48. EDICIÓN DESPUÉS DE ENVIAR

Una cotización `sent` no debe cambiar silenciosamente.

MVP recomendado:

Botón:

```text
Crear revisión
```

Generar:

```text
PRE-2026-0041-R1
```

o mecanismo de revisión equivalente.

Preservar original.

---

# 49. CONVERSIÓN A VIAJE

Crear tabla si no existe equivalente.

```sql
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),

  quote_id uuid not null
    references quotes(id),

  configuration_id uuid
    references configurations(id),

  status text not null default 'scheduled',

  scheduled_date date,
  completed_at timestamptz,

  actual_km numeric(12,2),
  actual_loading_hours numeric(12,2),
  actual_unloading_hours numeric(12,2),
  actual_waiting_hours numeric(12,2),
  actual_transfer_hours numeric(12,2),

  actual_fuel_amount numeric(16,2),
  actual_tolls_amount numeric(16,2),
  actual_permits_amount numeric(16,2),
  actual_travel_lodging_amount numeric(16,2),
  actual_other_amount numeric(16,2),

  actual_total_cost numeric(16,2),
  actual_margin_amount numeric(16,2),
  actual_margin_ratio numeric(8,6),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Si el CRM ya tiene viajes/servicios/órdenes de trabajo, integrar en esa entidad.

---

# 50. COSTO REAL

Fase inicial:

Permitir carga manual de:

```text
km reales
horas reales
combustible/gasto real
peajes
permisos
viáticos
otros
```

Opciones de cálculo:

### Modo A — costo teórico corregido

Usar costos unitarios del snapshot × consumo real de km/horas.

### Modo B — gasto real

Usar comprobantes/valores manuales.

Para MVP implementar al menos:

```text
actual_total_cost
```

y guardar desglose disponible.

---

# 51. MARGEN REAL

```text
actual_margin_amount =
  quote.final_price - actual_total_cost
```

```text
actual_margin_ratio =
  actual_margin_amount / quote.final_price
```

Mostrar:

```text
Margen estimado
Margen real
Desvío
```

---

# 52. DASHBOARD FUTURO

No es bloqueante para MVP, pero diseñar consultas pensando en:

```text
Monto cotizado
Cotizaciones emitidas
Aceptadas
Perdidas
Conversión %
Venta total
Costo estimado
Costo real
Margen estimado
Margen real

Rentabilidad por:
- cliente
- tipo de operación
- configuración
- activo
- comercial
- mes

Operación:
- km totales
- km retorno
- horas de espera
- horas productivas
- utilización
```

No construir dashboard complejo en la primera iteración salvo que ya exista módulo de analytics fácilmente extensible.

---

# 53. SEEDS DESDE EXCEL V3

## Activos

### A-01

```text
Atego 17 290 + plataforma
Tipo: Camión / plataforma
Capacidad: 20.000 kg

Combustible:       850 $/km
Neumáticos:        140 $/km
Mantenimiento:     180 $/km
Lubricantes:        30 $/km

Variable total:  1.200 $/km

Seguro:                 250.000 /mes
Patente/hab.:           100.000 /mes
Estructura:             300.000 /mes
Deprec./capital:        700.000 /mes
Otros:                  130.000 /mes

Total fijo:           1.480.000 /mes
Horas productivas:          160 h
Costo fijo activo:        9.250 /h
```

`is_assumption = true`.

---

### A-02

```text
Atego 17 260 + plataforma
```

Mismos valores ilustrativos iniciales que A-01.

`is_assumption = true`.

---

### A-03

```text
Tractor

Combustible:       1.900 $/km
Neumáticos:          220 $/km
Mantenimiento:       250 $/km
Lubricantes:          40 $/km

Variable total:    2.410 $/km

Seguro:                 350.000 /mes
Patente/hab.:           120.000 /mes
Estructura:             350.000 /mes
Deprec./capital:      1.400.000 /mes
Otros:                  160.000 /mes

Total fijo:           2.380.000 /mes
Horas productivas:          140 h
Costo fijo activo:       17.000 /h
```

`is_assumption = true`.

---

### A-04

```text
Carretón

Combustible:           0 $/km
Neumáticos:          250 $/km
Mantenimiento:       180 $/km
Lubricantes:          20 $/km

Variable total:      450 $/km

Seguro:              120.000 /mes
Patente/hab.:         80.000 /mes
Estructura:          100.000 /mes
Deprec./capital:     700.000 /mes
Otros:               120.000 /mes

Total fijo:        1.120.000 /mes
Horas productivas:       140 h
Costo fijo activo:      8.000 /h
```

Capacidad ilustrativa:

```text
30.000 kg
```

Debe validarse antes de uso real.

---

### A-05

```text
Vehículo guía
```

Crear inicialmente inactivo o marcado como supuesto.

---

# 54. SEED PERSONAL

### P-01

```text
Chofer equipo pesado
Costo empresa:          1.400.000 /mes
Horas productivas:            160 h
Costo:                      8.750 /h
```

### P-02

```text
Chofer tractor + carretón
Costo empresa:          1.400.000 /mes
Horas productivas:            140 h
Costo:                     10.000 /h
```

### P-03

```text
Acompañante / operador
Costo empresa:          1.100.000 /mes
Horas productivas:            160 h
Costo:                      6.875 /h
```

Todos:

```text
is_assumption = true
```

---

# 55. SEED CONFIGURACIONES

## CFG-01

```text
Atego 17 290 + plataforma

Activos:
A-01 x1

Personal:
P-01 x1

Capacidad: 20.000 kg
Hidrogrúa: Sí
Malacate: Sí
```

Resultado ilustrativo:

```text
Variable:   1.200 $/km
Activo:     9.250 $/h
Personal:   8.750 $/h
Fijo total: 18.000 $/h
```

---

## CFG-02

```text
Atego 17 260 + plataforma

A-02 x1
P-01 x1
Capacidad: 20.000 kg
Hidrogrúa: Sí
Malacate: Sí
```

---

## CFG-03

```text
Tractor + carretón

A-03 x1
A-04 x1
P-02 x1

Capacidad: 30.000 kg  [SUPUESTO]
Hidrogrúa: No
Malacate: No
```

Resultado ilustrativo:

```text
Variable:
2.410 + 450 = 2.860 $/km

Fijo activos:
17.000 + 8.000 = 25.000 $/h

Personal:
10.000 $/h

Fijo total:
35.000 $/h
```

---

## CFG-04

```text
Tractor + carretón + vehículo guía
```

Cargar inicialmente:

```text
is_active = false
```

hasta validar uso y costos reales.

---

# 56. TEST UNITARIO — CASO BASE EXCEL

Configuración:

```text
CFG-01
```

Input:

```text
km = 0
carga = 1 h
descarga = 1 h
espera = 0
traslado = 0
hidrogrúa = sí
horas hidrogrúa = 1
malacate = no
gastos externos = 0
contingencia = 4%
margen = 33%
tarifa mínima = 350.000
```

Esperado:

```text
Costo distancia       0
Costo tiempo      36.000
Hidrogrúa         65.000
Subtotal         101.000
Contingencia       4.040
Costo total       105.040

Precio técnico    156.776,12 aprox.
Precio recomendado 350.000

Margen final $    244.960
Margen final %    69,9886% aprox.
```

Este test debe pasar antes de conectar la UI.

---

# 57. TEST UNITARIO — TRACTOR + CARRETÓN

Configuración:

```text
CFG-03
Variable: 2.860 $/km
Fijo: 35.000 $/h
```

Input:

```text
km total              148
velocidad media        60 km/h
carga                   1 h
descarga                1 h
espera                 0,5 h
hidrogrúa              no
malacate               no
peajes             20.000
otros                   0
contingencia            4%
margen                 28%
```

Traslado sugerido:

```text
148 / 60 = 2,4666667 h
```

Base horas:

```text
1 + 1 + 2,4666667 = 4,4666667 h
```

Resultados esperados aproximados:

```text
Subtotal operativo     612.113,33
Contingencia             24.484,53
Costo total             636.597,87
Precio técnico          884.163,70
Precio recomendado      884.163,70
Margen                    28%
```

Tolerancia tests monetarios:

```text
± $0,02
```

según reglas de redondeo.

---

# 58. TESTS DE VALIDACIÓN

Crear tests para:

1. km negativos -> error.
2. horas negativas -> error.
3. margen >= 1 -> error.
4. tarifa final <= 0 -> error.
5. capacidad configuración nula/0 -> revisión/bloqueo.
6. peso > capacidad -> revisión.
7. ancho > límite -> revisión.
8. altura > límite -> revisión.
9. hidrogrúa solicitada + configuración sin hidrogrúa -> revisión.
10. malacate solicitado + configuración sin malacate -> revisión.
11. espera no duplicada en costo horario base.
12. mínimo hidrogrúa aplicado.
13. mínimo malacate aplicado.
14. tarifa mínima mayor al precio técnico -> usar tarifa mínima.
15. precio vendedor debajo de margen mínimo -> requiere autorización.
16. cambio de parámetros posterior no modifica snapshot.
17. cotización enviada no cambia al editar activos.
18. retorno vacío se incluye en km totales.

---

# 59. TEST DE SNAPSHOT

Secuencia:

```text
1. Crear cotización.
2. Calcular con variable CFG-01 = 1.200/km.
3. Guardar snapshot.
4. Cambiar activo para que la configuración pase a 1.500/km.
5. Consultar cotización original.
```

Resultado obligatorio:

```text
Cotización original sigue mostrando 1.200/km.
```

Nueva cotización:

```text
usa 1.500/km.
```

---

# 60. AUDITORÍA

Para tablas de costos conviene registrar:

```text
updated_at
updated_by
```

Opcional Fase 2:

```text
cost_change_log
```

Guardar:

```text
entidad
campo
valor anterior
valor nuevo
usuario
fecha
```

Especialmente útil para:

- combustible;
- salarios;
- márgenes;
- tarifa mínima.

---

# 61. ÍNDICES

Crear índices mínimos:

```sql
create index if not exists quotes_client_id_idx
  on quotes(client_id);

create index if not exists quotes_status_idx
  on quotes(status);

create index if not exists quotes_quote_date_idx
  on quotes(quote_date desc);

create index if not exists quotes_configuration_id_idx
  on quotes(configuration_id);

create index if not exists trips_quote_id_idx
  on trips(quote_id);
```

---

# 62. FORMATO MONETARIO

UI Argentina:

```text
$ 350.000
$ 884.163,70
```

Usar `Intl.NumberFormat`.

No guardar strings formateados en base.

Guardar:

```text
350000.00
```

---

# 63. IVA

No incorporar IVA dentro del costo interno salvo que PRESOL defina específicamente su tratamiento.

Preparar modelo comercial con:

```text
net_price
tax_rate
tax_amount
gross_price
```

pero si el CRM actual todavía no gestiona impuestos, MVP puede conservar:

```text
final_price = precio neto
```

y mostrar:

```text
+ IVA
```

como condición comercial.

No asumir una alícuota sin configuración.

---

# 64. RESPONSIVE

Desktop:

- formulario izquierda;
- resumen sticky derecha.

Mobile:

Orden:

```text
1. Cliente
2. Configuración
3. Ruta
4. Carga
5. Servicios
6. Gastos
7. Controles
8. Precio
9. Guardar / emitir
```

El precio recomendado y alertas críticas deben seguir visibles antes de enviar.

---

# 65. EXPERIENCIA DE USUARIO

No exponer complejidad innecesaria al vendedor.

El vendedor debe completar principalmente:

```text
Cliente
Configuración
Origen
Destino
Km
Horas
Carga
Servicios
Gastos
```

El motor resuelve:

```text
$/km
$/h
costos internos
contingencia
margen
precio técnico
precio recomendado
controles
```

---

# 66. ACCIONES DE COTIZACIÓN

Botones mínimos:

```text
Guardar borrador
Calcular
Emitir / marcar enviada
Duplicar
Crear revisión
Aceptar
Rechazar
Convertir a viaje
```

Mostrar sólo las acciones válidas según estado.

---

# 67. LISTADO DE COTIZACIONES

Ruta:

```text
/crm/cotizaciones
```

Columnas:

```text
Nº
Fecha
Cliente
Origen
Destino
Configuración
Precio final
Margen %
Estado
Validez
```

Filtros:

```text
Estado
Fecha
Cliente
Configuración
Tipo de operación
```

Búsqueda:

```text
Nº cotización
Cliente
Origen
Destino
```

---

# 68. DETALLE DE COTIZACIÓN

Debe separar visualmente:

## Comercial

```text
cliente
servicio
ruta
carga
precio
estado
```

## Interno

```text
costos
margen
configuración
snapshot
alertas
```

## Historial

```text
creada
calculada
enviada
aceptada/rechazada
convertida a viaje
```

---

# 69. VERSIONADO DEL MOTOR

Constante server-side:

```ts
export const COST_ENGINE_VERSION = "PRESOL-COST-1.0"
```

El valor debe corresponder con `cost_engine_versions`.

Modificar versión cuando cambie una fórmula o regla estructural.

NO modificar versión sólo porque cambió:

- combustible;
- salario;
- tarifa;
- margen.

Eso son parámetros.

Ejemplo:

```text
1.0 -> fórmula inicial
1.1 -> cambia tratamiento de retorno vacío
1.2 -> incorpora recargo por tipo de ruta
```

---

# 70. SEPARACIÓN ENTRE REGLA Y DATO

Ejemplo:

```text
waiting_hour_cost = 25.000
```

es un **dato**.

```text
waiting_cost = waiting_hours * waiting_hour_cost
```

es una **regla**.

Cambiar el dato no cambia versión del engine.

Cambiar la regla sí.

---

# 71. MIGRACIONES

Crear migraciones incrementales.

Ejemplo:

```text
001_cost_engine_core.sql
002_cost_engine_seeds.sql
003_quotes_cost_engine_fields.sql
004_quote_snapshots.sql
005_trips_actual_costs.sql
006_rls_cost_engine.sql
```

Adaptar numeración al repositorio.

No editar migraciones ya aplicadas.

---

# 72. ESTRATEGIA DE IMPLEMENTACIÓN

## Fase A — DB

Implementar:

- assets;
- personnel;
- configurations;
- relaciones;
- parameters;
- margin rules;
- engine versions;
- quotes;
- snapshots.

Verificar seeds.

---

## Fase B — motor puro

Implementar:

```text
calculateQuote()
```

Sin UI.

Correr tests.

No avanzar hasta que pasen los casos del Excel.

---

## Fase C — administración

CRUD:

- activos;
- personal;
- configuraciones;
- parámetros.

---

## Fase D — cotizador

Crear:

```text
Nueva cotización
Resumen
Controles
Precio
```

---

## Fase E — persistencia

Guardar:

- quote;
- resultados;
- snapshot.

---

## Fase F — workflow

Estados:

```text
draft
sent
accepted
rejected
```

y revisión.

---

## Fase G — viaje y real

Convertir aceptada a viaje.

Registrar costo real y margen real.

---

# 73. DEFINICIÓN DE DONE — MVP

El módulo se considera listo cuando:

- [ ] se pueden crear activos;
- [ ] se puede separar personal;
- [ ] se pueden combinar activos en configuraciones;
- [ ] CFG-01 reproduce el Excel;
- [ ] CFG-03 reproduce el Excel;
- [ ] el vendedor puede crear cotización;
- [ ] se calculan km totales;
- [ ] se calculan horas de traslado;
- [ ] espera no se duplica;
- [ ] hidrogrúa respeta mínimo;
- [ ] malacate respeta mínimo;
- [ ] contingencia funciona;
- [ ] margen se calcula como margen sobre venta;
- [ ] tarifa mínima funciona;
- [ ] precio final es editable;
- [ ] alerta de margen mínimo funciona;
- [ ] capacidad se valida;
- [ ] dimensiones generan revisión;
- [ ] compatibilidad de servicios se valida;
- [ ] se guarda snapshot;
- [ ] cambiar costos futuros no modifica cotizaciones anteriores;
- [ ] estados funcionan;
- [ ] cotización aceptada se puede convertir a viaje;
- [ ] se pueden cargar datos reales;
- [ ] se calcula margen real;
- [ ] RLS/permisos están aplicados;
- [ ] no se exponen costos internos en superficies públicas;
- [ ] responsive desktop/mobile;
- [ ] no hay errores TypeScript;
- [ ] tests del motor pasan;
- [ ] build de producción pasa.

---

# 74. NO HACER EN ESTA PRIMERA IMPLEMENTACIÓN

Evitar scope creep.

No implementar todavía salvo que ya exista infraestructura reutilizable:

- integración automática Google Maps;
- tracking GPS;
- optimización de rutas;
- telemetría;
- combustible por tarjeta;
- facturación electrónica;
- PDF comercial avanzado;
- firma digital;
- WhatsApp automático;
- pricing por machine learning;
- dashboards complejos;
- despacho automático.

Primero lograr que:

```text
COTIZAR → GUARDAR → ENVIAR → ACEPTAR → EJECUTAR → MEDIR MARGEN
```

funcione perfectamente.

---

# 75. FUTURA INTEGRACIÓN DE RUTAS

Diseñar una interfaz abstracta:

```ts
interface RouteDistanceProvider {
  calculateRoute(input: {
    base: string
    pickup: string
    delivery: string
  }): Promise<{
    kmBaseToPickup: number
    kmPickupToDelivery: number
    kmDeliveryToBase: number
    estimatedHours: number
  }>
}
```

MVP:

```text
ManualRouteDistanceProvider
```

Futuro:

```text
MapboxRouteDistanceProvider
GoogleRouteDistanceProvider
```

El motor de costos no debe depender de un proveedor de mapas.

---

# 76. FUTURA CONFIGURACIÓN MÁS COMPLEJA

El modelo N:N debe admitir:

```text
Tractor
+ carretón
+ vehículo guía
+ segundo vehículo guía
+ chofer
+ acompañante
```

sin modificar el motor.

Sólo cambian asociaciones y cantidades.

---

# 77. CRITERIO DE CALIDAD

No entregar una demo con datos mockeados dentro de componentes.

La implementación debe tener:

- persistencia real Supabase;
- estados reales;
- seeds reales del modelo V3;
- cálculo server-side;
- tipos;
- validación;
- errores controlados;
- tests;
- diseño integrado al CRM existente.

---

# 78. ORDEN DE EJECUCIÓN PARA ANTIGRAVITY

Ejecutar en este orden:

```text
1. Inspeccionar repo.
2. Reportar arquitectura encontrada en comentario/README técnico corto.
3. Mapear tablas existentes.
4. Crear migraciones.
5. Crear seeds.
6. Implementar repositorio del cost engine.
7. Implementar cálculo puro.
8. Implementar tests.
9. Verificar contra casos Excel.
10. Crear UI administración.
11. Crear cotizador.
12. Persistir snapshots.
13. Implementar workflow.
14. Implementar conversión a viaje.
15. Implementar costo/margen real.
16. Ejecutar typecheck.
17. Ejecutar tests.
18. Ejecutar build.
19. Corregir errores.
20. Entregar resumen de archivos modificados y migraciones.
```

---

# 79. INSTRUCCIÓN FINAL A ANTIGRAVITY

Implementar este módulo **dentro de la arquitectura existente de PRESOL**, sin rehacer el CRM y sin duplicar entidades ya existentes.

Priorizar en este orden:

```text
1. exactitud económica
2. trazabilidad
3. seguridad de costos internos
4. facilidad de uso comercial
5. extensibilidad
6. estética
```

La lógica del Excel V3 es la referencia funcional inicial.

Cuando exista diferencia entre una fórmula del Excel y este documento, revisar el caso antes de improvisar. La regla explícita de este documento debe prevalecer si corrige duplicaciones o ambigüedades, especialmente:

```text
- personal separado de activos;
- espera separada del tiempo base;
- margen sobre precio de venta;
- snapshot inmutable;
- configuración como unidad operativa;
- km de retorno incluidos;
- no hardcodear costos.
```

---

# 80. RESULTADO ESPERADO

Al finalizar, un comercial de PRESOL debe poder hacer:

```text
Nueva cotización
→ elegir cliente
→ elegir Tractor + Carretón
→ ingresar ruta/km
→ ingresar carga
→ ingresar tiempos
→ agregar servicios/gastos
→ ver controles operativos
→ ver costo interno
→ ver precio recomendado
→ ajustar precio final
→ validar margen
→ guardar/enviar
```

y el sistema debe conservar para siempre:

```text
qué se cotizó,
con qué configuración,
con qué costos,
con qué reglas,
qué margen se esperaba,
y cuánto margen dejó realmente el viaje.
```

Ese es el núcleo de **PRESOL Cost Engine v1.0**.
