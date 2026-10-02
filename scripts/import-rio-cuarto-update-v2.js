const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

const ADMIN_USER_ID = 'a73895c6-6172-47df-81b0-104679d09feb'; // admin@presol.com

const BASE_COMMERCIAL_NOTE = `PRESOL — transporte especial.
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

Estimados de referencia sujetos a cotización por viaje.`;

function norm(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runUpdateV2(isDryRun = false) {
  console.log(`\n================================================================`);
  console.log(`🚀 PRESOL CRM — RÍO CUARTO — UPDATE V2`);
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (Simulación sin escribir)' : 'EJECUCIÓN REAL EN BASE DE DATOS'}`);
  console.log(`================================================================\n`);

  // 1. Cargar archivo
  const xlsxPath = path.resolve(process.cwd(), 'temp_data/r4/PRESOL_Rio_Cuarto_MASTER_Update_2026-10-01.xlsx');
  const csvPath = path.resolve(process.cwd(), 'temp_data/r4/PRESOL_Rio_Cuarto_CRM_UPDATE_2026-10-01.csv');

  let rows = [];
  if (fs.existsSync(xlsxPath)) {
    console.log(`📖 Leyendo archivo Excel: ${xlsxPath} (Hoja: CRM Update)`);
    const wb = xlsx.readFile(xlsxPath);
    rows = xlsx.utils.sheet_to_json(wb.Sheets['CRM Update']);
  } else if (fs.existsSync(csvPath)) {
    console.log(`📖 Leyendo archivo CSV: ${csvPath}`);
    const wb = xlsx.readFile(csvPath);
    rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  } else {
    throw new Error('No se encontró archivo de datos V2 en temp_data/r4/');
  }

  console.log(`Total de filas detectadas: ${rows.length}\n`);

  // 2. Traer todos los prospectos de la DB para matching exhaustivo
  const { data: allDbProspects, error: fetchErr } = await supabase
    .from('prospects')
    .select('*');

  if (fetchErr) {
    throw new Error('Error consultando DB: ' + fetchErr.message);
  }

  // Encontrar max RC- number para correlatividad
  const rcNums = (allDbProspects || [])
    .map(p => p.external_id)
    .filter(id => id && id.startsWith('RC-'))
    .map(id => parseInt(id.replace('RC-', ''), 10))
    .filter(n => !isNaN(n));

  let nextRcNum = rcNums.length > 0 ? Math.max(...rcNums) + 1 : 96;
  console.log(`Próximo correlativo external_id disponible: RC-${String(nextRcNum).padStart(3, '0')}\n`);

  // Reporte y Contadores
  const stats = {
    nuevos: 0,
    actualizados: 0,
    preservados: 0,
    mergesRealizados: 0,
    actividadesCreadas: 0,
    actividadesExistentes: 0,
    errores: []
  };

  const processedProspectsByGroup = {
    Principal: [],
    Backup: [],
    Rental: [],
    Remoto: [],
    'Contenedores local': []
  };

  // 3. Procesar cada fila de CRM Update
  for (const row of rows) {
    const canonicalKey = row.canonical_key?.trim();
    const rawName = row.company_name?.toString().trim();
    if (!rawName || !canonicalKey) continue;

    const rNorm = norm(rawName);
    const aliases = (row.aliases || '')
      .split(';')
      .map(a => norm(a))
      .filter(a => a.length >= 4);

    // Matching en DB
    let matched = null;

    // A) Match por canonical_key ya guardado
    matched = allDbProspects.find(p => p.source_payload?.canonical_key === canonicalKey);

    // B) Match específico especial para bricchi-rio-cuarto
    if (!matched && canonicalKey === 'bricchi-rio-cuarto') {
      matched = allDbProspects.find(p => norm(p.company_name).includes('bricchi'));
    }

    // C) Match específico para SALA
    if (!matched && canonicalKey === 'sala-rio-cuarto') {
      matched = allDbProspects.find(p => p.external_id === 'RC-032' || (norm(p.company_name).includes('sala') && p.city?.toLowerCase().includes('cuarto')));
    }

    // D) Match estándar por nombre / aliases / teléfono
    if (!matched) {
      matched = allDbProspects.find(p => {
        const pNorm = norm(p.company_name);
        const isRemote = row.route_group === 'Remoto';
        const pIsRioCuarto = (p.city || '').toLowerCase().includes('cuarto');

        if (!isRemote && !pIsRioCuarto) return false;

        // Nombre exacto
        if (pNorm === rNorm) return true;

        // Aliases
        for (const a of aliases) {
          if (pNorm === a) return true;
          if (a.length >= 6 && (pNorm.includes(a) || a.includes(pNorm))) return true;
        }

        // Teléfono coincidente
        if (row.phone && p.primary_phone) {
          const c1 = row.phone.replace(/\D/g, '');
          const c2 = p.primary_phone.replace(/\D/g, '');
          if (c1.length >= 8 && c2.length >= 8 && (c1.includes(c2) || c2.includes(c1))) return true;
        }

        return false;
      });
    }

    // Determinar clase basada en prioridad
    const pClass = (row.priority && row.priority.startsWith('A')) ? 'A' : (row.priority && row.priority.startsWith('B')) ? 'B' : 'C';

    // Generar external_id para nuevos
    const externalId = matched ? matched.external_id : (
      row.route_group === 'Remoto' 
        ? `REM-${String(row.route_order).padStart(3, '0')}`
        : `RC-${String(nextRcNum++).padStart(3, '0')}`
    );

    // Ciudad: Para leads remotos no inventar sucursal en Río Cuarto
    const prospectCity = row.route_group === 'Remoto' ? (row.city || 'Remoto') : 'Río Cuarto';

    // Preservar estado comercial si no es 'pending'
    const contactStatus = (matched && matched.contact_status && matched.contact_status !== 'pending')
      ? matched.contact_status
      : 'pending';

    const prospectPayload = {
      external_id: externalId,
      company_name: matched ? matched.company_name : rawName,
      city: prospectCity,
      address: row.address || matched?.address || null,
      primary_phone: matched?.primary_phone || (row.phone ? row.phone.split('/')[0].trim() : null),
      phones_raw: row.phone || matched?.phones_raw || null,
      email: row.email || matched?.email || null,
      website: row.website || matched?.website || null,
      google_maps_url: row.maps_url || matched?.google_maps_url || null,
      commercial_category: row.category || matched?.commercial_category || 'Concesionario maquinaria',
      class: pClass,
      visit_priority: row.priority || 'A',
      ask_for: row.target_role || matched?.ask_for || null,
      probable_need: row.notes || matched?.probable_need || null,
      presol_offer: 'Camilla 15 TN · Carretón 30 TN · Hidrogrúa',
      sales_hook: `${row.subcategory || ''} — ${row.brands || ''}`.trim(),
      suggested_action: row.visit_reason || 'Presentación comercial PRESOL',
      contact_status: contactStatus,
      source_name: 'PRESOL Río Cuarto Update V2',
      source_url: row.source_url || matched?.source_url || null,
      source_payload: {
        canonical_key: canonicalKey,
        aliases: row.aliases,
        route_group: row.route_group,
        route_order: Number(row.route_order),
        planned_time: row.planned_time,
        brands: row.brands,
        subcategory: row.subcategory,
        target_role: row.target_role,
        visit_reason: row.visit_reason,
        next_action: row.next_action,
        whatsapp_raw: row.whatsapp,
        source_confidence: row.source_confidence,
        updated_v2_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    let targetProspectId = null;

    if (matched) {
      targetProspectId = matched.id;
      console.log(`[EXISTENTE] (${externalId}) ${rawName} -> ID: ${matched.id}`);
      if (!isDryRun) {
        const { error: updErr } = await supabase
          .from('prospects')
          .update(prospectPayload)
          .eq('id', matched.id);

        if (updErr) {
          stats.errores.push(`Error actualizando ${rawName}: ${updErr.message}`);
          console.error(`  Error update: ${updErr.message}`);
        }
      }
      stats.actualizados++;
    } else {
      console.log(`[NUEVO]     (${externalId}) ${rawName} [${row.priority}] (${row.route_group})`);
      if (!isDryRun) {
        prospectPayload.created_at = new Date().toISOString();
        const { data: insData, error: insErr } = await supabase
          .from('prospects')
          .insert(prospectPayload)
          .select('id')
          .single();

        if (insErr || !insData) {
          stats.errores.push(`Error insertando ${rawName}: ${insErr?.message}`);
          console.error(`  Error insert: ${insErr?.message}`);
          continue;
        }
        targetProspectId = insData.id;
      } else {
        targetProspectId = `simulated-${externalId}`;
      }
      stats.nuevos++;
    }

    if (targetProspectId) {
      const item = { prospectId: targetProspectId, row, externalId };
      const grp = row.route_group || 'Principal';
      if (processedProspectsByGroup[grp]) {
        processedProspectsByGroup[grp].push(item);
      }
    }
  }

  // 4. MERGE ESPECIAL OBLIGATORIO: Bricchi Hnos. S.A. vs Lonking Río Cuarto
  console.log(`\n----------------------------------------------------------------`);
  console.log(`🔗 REGLA 2: Merge / Consolidación Bricchi Hnos. <-> Lonking Río Cuarto`);
  console.log(`----------------------------------------------------------------`);

  const bricchiProspect = allDbProspects.find(p => norm(p.company_name).includes('bricchi'));
  const lonkingProspect = allDbProspects.find(p => norm(p.company_name).includes('lonking') && p.city?.toLowerCase().includes('cuarto'));

  if (bricchiProspect && lonkingProspect && bricchiProspect.id !== lonkingProspect.id) {
    console.log(`Bricchi Canónico: ${bricchiProspect.company_name} (${bricchiProspect.external_id}) ID: ${bricchiProspect.id}`);
    console.log(`Lonking Secundario: ${lonkingProspect.company_name} (${lonkingProspect.external_id}) ID: ${lonkingProspect.id}`);

    if (!isDryRun) {
      // A) Actualizar Bricchi con marcas y teléfonos de Lonking
      const bricchiSourcePayload = bricchiProspect.source_payload || {};
      await supabase.from('prospects').update({
        phones_raw: `${bricchiProspect.phones_raw || ''} / Lonking: +54 358 431-0101`.trim(),
        sales_hook: 'Lonking / Apache / Hanomag / otros',
        probable_need: 'Concesionario oficial Lonking y Apache en Río Cuarto. Traslado carretón 30 TN y camilla 15 TN.',
        source_payload: {
          ...bricchiSourcePayload,
          canonical_key: 'bricchi-rio-cuarto',
          merged_aliases: ['Lonking Río Cuarto', 'Lonking en Bricchi', 'Bricchi Hnos. S.A.'],
          merged_secondary_id: lonkingProspect.id,
          merge_date: new Date().toISOString()
        }
      }).eq('id', bricchiProspect.id);

      // B) Marcar Lonking como alias consolidado
      const lonkingSourcePayload = lonkingProspect.source_payload || {};
      await supabase.from('prospects').update({
        contact_status: 'duplicate',
        source_payload: {
          ...lonkingSourcePayload,
          is_merged_into: bricchiProspect.id,
          canonical_key: 'bricchi-rio-cuarto',
          merge_status: 'merged_alias',
          merge_note: `Consolidado en Bricchi Hnos. S.A. (${bricchiProspect.external_id}) donde opera la concesión oficial.`
        }
      }).eq('id', lonkingProspect.id);

      // C) Nota trazable en comments
      await supabase.from('comments').insert({
        prospect_id: bricchiProspect.id,
        body: `[CONSOLIDACIÓN V2] Se unificó la cuenta de Lonking Río Cuarto (${lonkingProspect.external_id}) en esta ficha canónica Bricchi Hnos. S.A., confirmando la ubicación en Ruta A005 km 1,2.`,
        created_by: ADMIN_USER_ID,
        created_at: new Date().toISOString()
      });

      stats.mergesRealizados++;
      console.log(`✅ Merge trazable completado: Bricchi es la cuenta canónica.`);
    } else {
      console.log(`[DRY-RUN] Se consolidaría Lonking (${lonkingProspect.external_id}) dentro de Bricchi (${bricchiProspect.external_id}).`);
      stats.mergesRealizados++;
    }
  } else {
    console.log(`No se requiere merge: Bricchi y Lonking ya están consolidados o no coexisten separados.`);
  }

  // 5. GIRA PRINCIPAL: Crear o Actualizar Gira Rev 2026-10-01
  const tourName = 'Río Cuarto — Vial + Agrícola — Rev 2026-10-01';
  console.log(`\n----------------------------------------------------------------`);
  console.log(`🗺️ CONFIGURANDO GIRA PRINCIPAL: "${tourName}"`);
  console.log(`----------------------------------------------------------------`);

  let tripId = null;
  const mainStops = processedProspectsByGroup['Principal'].sort((a, b) => Number(a.row.route_order) - Number(b.row.route_order));

  console.log(`Total de paradas de la gira principal: ${mainStops.length}`);

  if (!isDryRun) {
    // Buscar si ya existe la gira
    const { data: existingTrips } = await supabase
      .from('trips')
      .select('id, name')
      .or(`name.ilike.%Río Cuarto%Rev 2026-10-01%,name.ilike.%Río Cuarto — Concesionarios Viales + Agrícolas%`)
      .limit(1);

    if (existingTrips && existingTrips.length > 0) {
      tripId = existingTrips[0].id;
      console.log(`Actualizando gira existente: ID ${tripId}`);
      await supabase.from('trips').update({
        name: tourName,
        description: 'Gira comercial Río Cuarto: 14 concesionarios viales y agrícolas por RN A005, RN36 y Av. Godoy Cruz.',
        status: 'planned',
        owner_id: ADMIN_USER_ID,
        updated_at: new Date().toISOString()
      }).eq('id', tripId);
    } else {
      console.log(`Creando nueva gira en borrador...`);
      const { data: newTrip, error: tErr } = await supabase.from('trips').insert({
        name: tourName,
        description: 'Gira comercial Río Cuarto: 14 concesionarios viales y agrícolas por RN A005, RN36 y Av. Godoy Cruz.',
        trip_date: null,
        status: 'planned',
        owner_id: ADMIN_USER_ID,
        created_by: ADMIN_USER_ID,
        created_at: new Date().toISOString()
      }).select('id').single();

      if (tErr) throw new Error('Error creando gira: ' + tErr.message);
      tripId = newTrip.id;
      console.log(`Gira creada con éxito: ID ${tripId}`);
    }

    // Cargar paradas en trip_stops
    await supabase.from('trip_stops').delete().eq('trip_id', tripId);

    const tripStopsToInsert = mainStops.map(s => {
      const order = Number(s.row.route_order);
      const time = s.row.planned_time || '10:00';
      const routeNote = `${time} hs — ${s.row.subcategory} (${s.row.brands}): ${s.row.notes}`;

      return {
        trip_id: tripId,
        prospect_id: s.prospectId,
        stop_order: order,
        status: 'pending',
        route_note: routeNote,
        created_at: new Date().toISOString()
      };
    });

    const { error: stopsErr } = await supabase.from('trip_stops').insert(tripStopsToInsert);
    if (stopsErr) {
      console.error('Error insertando paradas:', stopsErr.message);
      stats.errores.push('Error insertando paradas: ' + stopsErr.message);
    } else {
      console.log(`✅ ${tripStopsToInsert.length} paradas cargadas en orden 1 a 14 en la gira.`);
    }

    // 6. Actividades y Tareas en Tasks
    console.log(`\n📋 Sincronizando tareas y notas comerciales en agenda...`);

    // A) Para las 14 paradas de la gira principal
    for (const s of mainStops) {
      const order = Number(s.row.route_order);

      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('prospect_id', s.prospectId)
        .eq('status', 'pending')
        .limit(1);

      if (!existingTask || existingTask.length === 0) {
        await supabase.from('tasks').insert({
          prospect_id: s.prospectId,
          trip_id: tripId,
          title: `Visita comercial PRESOL — traslado de maquinaria (${s.row.company_name})`,
          description: `Parada #${order} (${s.row.planned_time} hs). Foco: ${s.row.brands}. Pedir: ${s.row.target_role}. ${s.row.notes}`,
          type: 'meeting',
          priority: s.row.priority?.startsWith('A') ? 'high' : 'normal',
          status: 'pending',
          assigned_to: ADMIN_USER_ID,
          created_by: ADMIN_USER_ID,
          created_at: new Date().toISOString()
        });
        stats.actividadesCreadas++;
      } else {
        stats.actividadesExistentes++;
      }

      // Nota comercial base en comments
      const { data: existingComment } = await supabase
        .from('comments')
        .select('id')
        .eq('prospect_id', s.prospectId)
        .ilike('body', '%PRESOL — transporte especial%')
        .limit(1);

      if (!existingComment || existingComment.length === 0) {
        await supabase.from('comments').insert({
          prospect_id: s.prospectId,
          body: BASE_COMMERCIAL_NOTE,
          created_by: ADMIN_USER_ID,
          created_at: new Date().toISOString()
        });
      }
    }

    // B) Para Rental, Backup y Contenedores
    const otherGroups = [...processedProspectsByGroup['Backup'], ...processedProspectsByGroup['Rental'], ...processedProspectsByGroup['Remoto'], ...processedProspectsByGroup['Contenedores local']];

    for (const item of otherGroups) {
      const isRemoteContainer = item.row.route_group === 'Remoto';
      const isLocalContainer = item.row.route_group === 'Contenedores local';
      const isRental = item.row.route_group === 'Rental';

      const taskType = isRemoteContainer ? 'call' : 'follow_up';
      const taskTitle = isRemoteContainer
        ? `Llamada comercial contenedores marítimos ISO (${item.row.company_name})`
        : isRental
        ? `Contacto comercial rental de maquinaria (${item.row.company_name})`
        : isLocalContainer
        ? `Contacto comercial contenedores de obra (${item.row.company_name})`
        : `Contacto comercial backup maquinaria (${item.row.company_name})`;

      const taskDesc = isRemoteContainer
        ? `Validar origen/depósito habitual de entregas a Río Cuarto, frecuencia, si tercerizan tramo final y tipo de container 20'/40'/HC/reefer. Pedir: ${item.row.target_role}.`
        : `${item.row.subcategory} — ${item.row.brands}. Pedir: ${item.row.target_role}. ${item.row.notes}`;

      const { data: exTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('prospect_id', item.prospectId)
        .eq('status', 'pending')
        .limit(1);

      if (!exTask || exTask.length === 0) {
        await supabase.from('tasks').insert({
          prospect_id: item.prospectId,
          title: taskTitle,
          description: taskDesc,
          type: taskType,
          priority: item.row.priority?.startsWith('A') ? 'high' : 'normal',
          status: 'pending',
          assigned_to: ADMIN_USER_ID,
          created_by: ADMIN_USER_ID,
          created_at: new Date().toISOString()
        });
        stats.actividadesCreadas++;
      } else {
        stats.actividadesExistentes++;
      }

      // Nota comercial en comments
      const { data: exComment } = await supabase
        .from('comments')
        .select('id')
        .eq('prospect_id', item.prospectId)
        .ilike('body', '%PRESOL — transporte especial%')
        .limit(1);

      if (!exComment || exComment.length === 0) {
        await supabase.from('comments').insert({
          prospect_id: item.prospectId,
          body: BASE_COMMERCIAL_NOTE,
          created_by: ADMIN_USER_ID,
          created_at: new Date().toISOString()
        });
      }
    }
  }

  // 7. REPORTE FINAL
  console.log(`\n================================================================`);
  console.log(`📊 REPORTE DE RESULTADOS`);
  console.log(`================================================================`);
  console.log(`- Prospectos creados nuevos:       ${stats.nuevos}`);
  console.log(`- Prospectos existentes update:    ${stats.actualizados}`);
  console.log(`- Merges consolidados:             ${stats.mergesRealizados}`);
  console.log(`- Actividades nuevas creadas:      ${stats.actividadesCreadas}`);
  console.log(`- Actividades previas conservadas: ${stats.actividadesExistentes}`);
  console.log(`- Errores reportados:              ${stats.errores.length}`);
  if (stats.errores.length > 0) {
    stats.errores.forEach(e => console.log(`  ❌ ${e}`));
  }
  console.log(`================================================================\n`);
}

const isDryRun = process.argv.includes('--dry-run');
runUpdateV2(isDryRun).catch(err => {
  console.error('\n❌ ERROR FATAL:', err);
  process.exit(1);
});
