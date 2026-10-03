import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Faltan variables de entorno de Supabase.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Admin user ID
const ADMIN_USER_ID = 'a73895c6-6172-47df-81b0-104679d09feb'; // admin@presol.com

const INITIAL_COMMERCIAL_NOTE = `PRESOL — proveedor de transporte especial para maquinaria.
Camilla: capacidad 15 TN.
Carretón vial: capacidad 30 TN.
Hidrogrúa disponible para maniobras y apoyo.
Objetivo de la visita: detectar frecuencia de traslados, equipos típicos, zonas, necesidad de entregas/recuperos y contacto responsable de Logística / Expedición / Posventa / Gerencia.
Estimados sujetos a cotización por viaje: camilla ~$3.500/km carga + IVA y carretón ~$6.000/km carga + IVA.`;

function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface CsvRow {
  route_order: number;
  planned_time: string;
  company_name: string;
  city: string;
  province: string;
  category: string;
  subcategory: string;
  brand: string;
  priority: string;
  commercial_status: string;
  address: string;
  phone: string;
  whatsapp: string;
  website: string;
  maps_url: string;
  target_role: string;
  visit_reason: string;
  next_action: string;
  notes: string;
  source_url: string;
}

export async function runImport(isDryRun: boolean = false) {
  console.log(`\n======================================================`);
  console.log(`🚀 IMPORTACIÓN GIRA RÍO CUARTO — PRESOL CRM`);
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (Simulación sin escribir)' : 'EJECUCIÓN REAL'}`);
  console.log(`======================================================\n`);

  // 1. Leer archivo
  const csvPath = path.resolve(process.cwd(), 'temp_data/PRESOL_Rio_Cuarto_CRM_import.csv');
  const xlsxPath = path.resolve(process.cwd(), 'temp_data/PRESOL_Rio_Cuarto_Concesionarios_Gira_CRM.xlsx');

  let rows: CsvRow[] = [];

  if (fs.existsSync(xlsxPath)) {
    console.log(`📖 Leyendo desde: ${xlsxPath} (Hoja: CRM Import)`);
    const wb = xlsx.readFile(xlsxPath);
    const sheet = wb.Sheets['CRM Import'] || wb.Sheets[wb.SheetNames[0]];
    rows = xlsx.utils.sheet_to_json<CsvRow>(sheet);
  } else if (fs.existsSync(csvPath)) {
    console.log(`📖 Leyendo desde: ${csvPath}`);
    const wb = xlsx.readFile(csvPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = xlsx.utils.sheet_to_json<CsvRow>(sheet);
  } else {
    throw new Error('No se encontró el archivo de datos en temp_data/');
  }

  console.log(`Total de filas detectadas: ${rows.length}\n`);

  // Estadísticas
  let createdCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  const processedProspects: { prospectId: string; row: CsvRow; isNew: boolean }[] = [];

  // Traer todos los prospectos de Río Cuarto para matcheo en memoria
  const { data: existingProspects, error: fetchErr } = await supabase
    .from('prospects')
    .select('*')
    .ilike('city', '%cuarto%');

  if (fetchErr) {
    throw new Error('Error consultando prospectos existentes: ' + fetchErr.message);
  }

  console.log(`Prospectos existentes en Río Cuarto en DB: ${existingProspects?.length || 0}\n`);

  for (const row of rows) {
    const rawName = row.company_name?.trim();
    if (!rawName) continue;

    const normName = normalizeName(rawName);

    // Buscar match exacto o muy cercano
    const matched = existingProspects?.find(p => {
      const pNorm = normalizeName(p.company_name);
      return pNorm === normName ||
        (normName.includes('demarchi') && pNorm.includes('demarchi')) ||
        (normName.includes('pallotti') && pNorm.includes('pallotti')) ||
        (normName.includes('catpro') && pNorm.includes('catpro')) ||
        (normName.includes('semtraco') && pNorm.includes('semtraco')) ||
        (normName.includes('simonassi') && pNorm.includes('simonassi')) ||
        (normName.includes('marconi') && pNorm.includes('marconi')) ||
        (normName.includes('agrokeegan') && pNorm.includes('agrokeegan')) ||
        (normName.includes('grossvial') && pNorm.includes('grossvial'));
    });

    const pClass = (row.priority?.startsWith('A')) ? 'A' : (row.priority?.startsWith('B')) ? 'B' : 'C';

    const prospectPayload: any = {
      company_name: matched ? matched.company_name : rawName,
      city: 'Río Cuarto',
      address: row.address || matched?.address || null,
      primary_phone: matched?.primary_phone || (row.phone ? row.phone.split('/')[0].trim() : null),
      phones_raw: row.phone || matched?.phones_raw || null,
      website: row.website || matched?.website || null,
      google_maps_url: row.maps_url || matched?.google_maps_url || null,
      commercial_category: 'Concesionario maquinaria',
      class: pClass,
      visit_priority: row.priority || 'A+',
      ask_for: row.target_role || matched?.ask_for || null,
      probable_need: row.notes || matched?.probable_need || null,
      presol_offer: 'Camilla 15 TN · Carretón 30 TN · Hidrogrúa',
      sales_hook: `${row.subcategory || ''} — ${row.brand || ''}`.trim(),
      suggested_action: row.visit_reason || 'Visita comercial inicial PRESOL',
      contact_status: matched?.contact_status || 'pending',
      source_name: 'Gira Río Cuarto Concesionarios',
      source_url: row.source_url || matched?.source_url || null,
      source_payload: {
        brand: row.brand,
        subcategory: row.subcategory,
        priority: row.priority,
        target_role: row.target_role,
        visit_reason: row.visit_reason,
        next_action: row.next_action,
        whatsapp_raw: row.whatsapp,
        planned_time: row.planned_time,
        route_order: Number(row.route_order)
      },
      updated_at: new Date().toISOString()
    };

    if (matched) {
      console.log(`[EXISTENTE] #${row.route_order} ${rawName} -> ID: ${matched.id}`);
      if (!isDryRun) {
        const { error: updErr } = await supabase
          .from('prospects')
          .update(prospectPayload)
          .eq('id', matched.id);
        if (updErr) console.error('  Error actualizando prospecto:', updErr.message);
      }
      updatedCount++;
      processedProspects.push({ prospectId: matched.id, row, isNew: false });
    } else {
      console.log(`[NUEVO]     #${row.route_order} ${rawName} (${row.priority})`);
      let newId = 'simulated-id-' + row.route_order;
      if (!isDryRun) {
        prospectPayload.created_at = new Date().toISOString();
        const { data: insData, error: insErr } = await supabase
          .from('prospects')
          .insert(prospectPayload)
          .select('id')
          .single();
        if (insErr || !insData) {
          console.error('  Error creando prospecto:', insErr?.message);
          continue;
        }
        newId = insData.id;
      }
      createdCount++;
      processedProspects.push({ prospectId: newId, row, isNew: true });
    }
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`Resumen Prospectos:`);
  console.log(`- Nuevos creados: ${createdCount}`);
  console.log(`- Actualizados:   ${updatedCount}`);
  console.log(`- Total en gira:  ${processedProspects.length}`);
  console.log(`------------------------------------------------------\n`);

  // 2. Crear o Actualizar Gira
  const tourName = 'Río Cuarto — Concesionarios Viales + Agrícolas';
  console.log(`🗺️ Configurando Gira: "${tourName}"...`);

  let tripId: string | null = null;

  if (!isDryRun) {
    // Buscar si ya existe la gira
    const { data: existingTrips } = await supabase
      .from('trips')
      .select('id, name')
      .ilike('name', '%Río Cuarto%Concesionarios%')
      .limit(1);

    if (existingTrips && existingTrips.length > 0) {
      tripId = existingTrips[0].id;
      console.log(`  Gira existente encontrada: ID ${tripId}`);
      await supabase
        .from('trips')
        .update({
          name: tourName,
          description: 'Ruta comercial en Río Cuarto: Concesionarios viales y agrícolas por RN A005 y Av. Godoy Cruz.',
          status: 'planned',
          owner_id: ADMIN_USER_ID,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId);
    } else {
      console.log(`  Creando nueva gira en borrador/planificada...`);
      const { data: newTrip, error: tripErr } = await supabase
        .from('trips')
        .insert({
          name: tourName,
          description: 'Ruta comercial en Río Cuarto: Concesionarios viales y agrícolas por RN A005 y Av. Godoy Cruz.',
          trip_date: null, // Dejar sin programar según directiva de contrato
          status: 'planned',
          owner_id: ADMIN_USER_ID,
          created_by: ADMIN_USER_ID,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (tripErr || !newTrip) {
        throw new Error('Error creando gira: ' + tripErr?.message);
      }
      tripId = newTrip.id;
      console.log(`  Gira creada con éxito: ID ${tripId}`);
    }

    // 3. Crear paradas (trip_stops) en orden
    console.log(`\n📍 Cargando paradas de la gira en trip_stops...`);
    // Borrar paradas previas de esta gira para idempotencia limpia
    await supabase.from('trip_stops').delete().eq('trip_id', tripId);

    const tripStopsToInsert = processedProspects.map(p => {
      const order = Number(p.row.route_order);
      const isBackup = order > 12;
      const routeNote = isBackup 
        ? `[Backup si queda tiempo] ${p.row.brand || ''} — ${p.row.notes || ''}`
        : `${p.row.planned_time} hs — ${p.row.subcategory} (${p.row.brand}): ${p.row.notes}`;

      return {
        trip_id: tripId,
        prospect_id: p.prospectId,
        stop_order: order,
        status: 'pending',
        route_note: routeNote,
        created_at: new Date().toISOString()
      };
    });

    const { error: stopsErr } = await supabase.from('trip_stops').insert(tripStopsToInsert);
    if (stopsErr) {
      console.error('  Error insertando paradas:', stopsErr.message);
    } else {
      console.log(`  ${tripStopsToInsert.length} paradas insertadas en orden 1 a 15.`);
    }

    // 4. Crear tareas de seguimiento pendientes (Actividades) para los 12 principales
    console.log(`\n📋 Creando actividades/tareas pendientes en tasks...`);
    let tasksCreated = 0;

    for (const p of processedProspects) {
      const order = Number(p.row.route_order);
      const isBackup = order > 12;

      // Verificar si ya existe tarea pendiente para este prospecto
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('prospect_id', p.prospectId)
        .eq('status', 'pending')
        .limit(1);

      if (!existingTask || existingTask.length === 0) {
        await supabase.from('tasks').insert({
          prospect_id: p.prospectId,
          trip_id: tripId,
          title: `Visita comercial PRESOL — traslado de maquinaria (${p.row.company_name})`,
          description: `Orden #${order} (${p.row.planned_time} hs). Foco: ${p.row.subcategory} / ${p.row.brand}. Pedir: ${p.row.target_role}. ${p.row.notes}`,
          type: 'meeting',
          priority: p.row.priority?.startsWith('A') ? 'high' : 'normal',
          status: 'pending',
          assigned_to: ADMIN_USER_ID,
          created_by: ADMIN_USER_ID,
          created_at: new Date().toISOString()
        });
        tasksCreated++;
      }

      // 5. Agregar nota comercial inicial a cada prospecto en comments (si no existe)
      const { data: existingComment } = await supabase
        .from('comments')
        .select('id')
        .eq('prospect_id', p.prospectId)
        .ilike('body', '%PRESOL — proveedor de transporte especial%')
        .limit(1);

      if (!existingComment || existingComment.length === 0) {
        await supabase.from('comments').insert({
          prospect_id: p.prospectId,
          body: INITIAL_COMMERCIAL_NOTE,
          created_by: ADMIN_USER_ID,
          created_at: new Date().toISOString()
        });
      }
    }

    console.log(`  ${tasksCreated} tareas/seguimientos creados en la agenda.`);
    console.log(`  Notas comerciales iniciales sincronizadas en comentarios.`);
  }

  console.log(`\n======================================================`);
  console.log(`✅ PROCESO COMPLETADO EXITOSAMENTE`);
  console.log(`======================================================\n`);
}

// Ejecutar
const isDryRun = process.argv.includes('--dry-run');
runImport(isDryRun).catch(err => {
  console.error('\n❌ ERROR FATAL:', err);
  process.exit(1);
});
