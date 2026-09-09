# PRESOL CRM - Documentación y Auditoría del Sistema

Este documento describe la arquitectura, stack tecnológico, modelo de datos y funcionalidades principales del MVP (Producto Mínimo Viable) del sistema CRM desarrollado para PRESOL. Su propósito es servir como mapa técnico para futuras auditorías, mantenimiento y ampliaciones.

## 1. Stack Tecnológico

*   **Framework:** Next.js 16.3 (App Router, Turbopack)
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS 4.0
*   **Iconografía:** Lucide React
*   **Base de Datos & Backend:** Supabase (PostgreSQL, Auth, SSR)
*   **Despliegue:** Vercel (Frontend & Serverless Functions)
*   **Estrategia Mobile:** Progressive Web App (PWA) instalable, con diseño *mobile-first*.

---

## 2. Arquitectura de Seguridad y Acceso

*   **Autenticación:** Gestionada a través de Supabase Auth (Email / Password).
*   **Protección de Rutas:** Se utiliza un interceptor o *Middleware proxy* en Next.js (`src/proxy.ts`) que verifica la existencia de una sesión activa. Si el usuario no está logueado, es redirigido automáticamente a `/login`.
*   **Conexión a Base de Datos (SSR):** Las peticiones desde los Server Components de Next.js utilizan un cliente administrativo con `SUPABASE_SERVICE_ROLE_KEY` (RLS bypass) para garantizar un acceso ágil y sin fricciones a los datos en el servidor, mientras que la autenticación del usuario maneja la capa de presentación.

---

## 3. Modelo de Datos (Schema)

La base de datos relacional está construida sobre PostgreSQL e incluye las siguientes entidades principales:

1.  **`prospects` (Prospectos/Empresas):**
    *   Núcleo del CRM. Almacena la razón social (`company_name`), `city`, `sector` (rubro), `class` (Clase A, B o C), `visit_priority`, servicios PRESOL sugeridos (`presol_services`), notas de dirección/gerencia (`pending_data`).
2.  **`contacts` (Contactos Telefónicos):**
    *   Vinculados a un prospecto. Permite múltiples contactos con atributos como `full_name`, `role_title`, `phone`, `email` y la marca booleana `is_primary`.
3.  **`activities` (Actividades/Interacciones):**
    *   Historial cronológico de la relación con el prospecto. Registra llamadas, visitas presenciales y emails, además del resultado de la interacción (`outcome` o `status`) y notas.
4.  **`tasks` (Tareas y Recordatorios):**
    *   Gestión de próximos pasos ("llamar el martes", "enviar presupuesto"). Poseen estado (`pending`, `completed`), fecha de vencimiento e interconexión con prospectos.
5.  **`opportunities` (Oportunidades Comerciales):**
    *   Gestión del pipeline (Embudo de Ventas). Registra montos estimados, fechas de cierre (`expected_close_date`) y etapas (`lead`, `proposal`, `negotiation`, `closed_won`, `closed_lost`).
6.  **`trips` y `trip_stops` (Giras / Planificación de Rutas):**
    *   Módulo especializado para el trabajo de campo. `trips` define el nombre y fecha de una salida. `trip_stops` enlaza los prospectos a visitar en esa gira, asignándoles un orden lógico y controlando su estado (`pending`, `completed`, `skipped`).

---

## 4. Funcionalidades Principales Desarrolladas

### 4.1. Módulo de Prospectos
*   **Directorio Interactivo:** Listado adaptativo (Tarjetas en móvil, Tabla en Desktop).
*   **Filtros Avanzados (Mobile-Premium):** Sistema de filtrado tipo "Bottom Sheet" (modal desde la base en móviles) que soluciona los problemas de scroll anidado. Permite filtrar por **Ciudad** (selección múltiple), **Rubro** (estandarizado en 10 categorías limpias) y **Clase** (A, B, C).
*   **Creación Manual:** Capacidad de registrar rápidamente a un prospecto desde la ruta (Empresa, Ciudad, Rubro, Notas rápidas).
*   **Gestión de Contactos (CRUD):** Modal integrado para enriquecer el perfil añadiendo nombres, cargos y teléfonos dinámicamente.

### 4.2. Perfil 360° del Prospecto
Vista detallada que unifica la inteligencia comercial:
*   **Resumen Ejecutivo:** Clase, Prioridad, "Gancho comercial sugerido" y un bloque destacado en color ámbar para las **"Notas de Dirección"** (Directrices gerenciales cargadas vía Excel).
*   **Línea de Tiempo:** Historial de actividades.
*   **Pipeline Integrado:** Tarjetas de oportunidades y tareas pendientes asociadas exclusivamente a esa empresa.

### 4.3. Módulo de Giras (Routing)
*   **Armado de Giras:** Interfaz para nombrar una gira y buscar/agregar prospectos a la ruta del día.
*   **Ejecución en Campo:** Durante la gira, el usuario puede marcar las paradas como "Completadas", lo que actualiza el progreso en tiempo real y permite accionar rápidamente sobre la información relevada en la visita.

### 4.4. Tablero de Control (Dashboard)
*   **KPIs en Tiempo Real:** Total de prospectos, oportunidades abiertas (sumatoria de capital), tareas pendientes y gira activa.
*   **Feed de Actividad:** Registro de los últimos movimientos del equipo.

### 4.5. Limpieza y Carga de Datos
*   **Scripts de Migración (`scripts/`):** Se crearon y ejecutaron utilidades internas para cruzar los Excels originales de operaciones y estandarizar los datos en PostgreSQL.
    *   Limpieza de 289 prospectos a 10 rubros oficiales.
    *   Inyección de datos gerenciales (Notas de dirección) en la tabla base.

---

## 5. Diseño y UX
*   Total personalización con la marca institucional (Logotipos PRESOL con y sin transparencia adaptados para Menú y Login).
*   Controles táctiles y amigables para pulgares (Thumbing UX).
*   PWA nativa que soporta icono de escritorio, *splash screen* básica y elimina la barra del navegador, simulando una App Nativa iOS/Android.
