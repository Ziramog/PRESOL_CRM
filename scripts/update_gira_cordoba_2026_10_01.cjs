const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function run() {
  console.log('=== INICIANDO ACTUALIZACIÓN DE PROSPECTOS GIRA CÓRDOBA 2026-10-01 ===\n');

  // Admin user ID
  const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
  const adminId = adminProfile ? adminProfile.id : null;

  // -------------------------------------------------------------
  // 1. SULLAIR ARGENTINA
  // -------------------------------------------------------------
  console.log('--- 1. Actualizando Sullair Argentina ---');
  const sullairId = '8b95951c-3f0d-4559-a66e-6aabb018d234';
  const { data: sullairExisting } = await supabase.from('prospects').select('primary_phone, phones_raw, source_payload').eq('id', sullairId).single();
  
  // Regla: Si ya existe y tiene teléfono, conservar ese campo
  const sullairPhone = sullairExisting.primary_phone || '0810 777 0707';
  const sullairPhonesRaw = sullairExisting.phones_raw || '0810 777 0707 / 0351 2474826';

  const sullairPayload = {
    ...(sullairExisting.source_payload || {}),
    lat: -31.4677975,
    lng: -64.1690323
  };

  await supabase.from('prospects').update({
    company_name: 'Sullair Argentina',
    address: 'Av. Circunvalación s/N° Colectora Sur, e/Camino a San Carlos y Camino a San Antonio',
    city: 'Córdoba',
    website: 'https://www.sullairargentina.com/',
    email: 'contacto@sullair.com.ar',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=Sullair+Argentina+Av.+Circunvalaci%C3%B3n+Colectora+Sur+C%C3%B3rdoba+Argentina',
    sector: 'Alquiler y venta de maquinaria y equipos industriales: compresores, grupos electrógenos, manipuladores, movimiento de tierra, plataformas y torres de iluminación',
    commercial_category: 'Maquinaria industrial / Rental',
    class: 'A',
    visit_priority: 'A+',
    contact_status: 'interested',
    primary_phone: sullairPhone, // CONSERVADO
    phones_raw: sullairPhonesRaw, // CONSERVADO
    ask_for: 'Agustin Scarafia (Gerente Sucursal) / Rental / Operaciones / Logística / Service',
    probable_need: 'Muy alta: entregas, retiros, recuperos de equipos y picos de logística de alquiler',
    suggested_action: 'Reunión: relevar transporte propio/tercerizado, frecuencia, flota y requisitos de alta',
    pending_data: 'Horario: Lun–Vie 09:00–18:00 (ficha local) | Sucursal Córdoba confirmada en web oficial.',
    source_name: 'https://www.sullairargentina.com/contacto/',
    evidence: 'Ficha local Sullair Argentina (Córdoba) | Web oficial',
    source_payload: sullairPayload,
    updated_at: new Date().toISOString()
  }).eq('id', sullairId);

  // En contactos: conservar el teléfono existente de Agustin Scarafia
  const { data: sullairContacts } = await supabase.from('contacts').select('*').eq('prospect_id', sullairId);
  if (sullairContacts && sullairContacts.length > 0) {
    const agustin = sullairContacts[0];
    console.log(`  Contacto existente: ${agustin.full_name}, Teléfono conservado: ${agustin.phone}`);
    if (!agustin.email) {
      await supabase.from('contacts').update({ email: 'contacto@sullair.com.ar' }).eq('id', agustin.id);
    }
  }
  console.log('  -> Sullair Argentina actualizado correctamente.');

  // -------------------------------------------------------------
  // 2. ROMECO CÓRDOBA
  // -------------------------------------------------------------
  console.log('\n--- 2. Actualizando ROMECO Córdoba ---');
  const romecoId = '71040789-5d96-4bea-af36-30ea17487764';
  const { data: romecoExisting } = await supabase.from('prospects').select('primary_phone, phones_raw, source_payload').eq('id', romecoId).single();

  const romecoPhone = romecoExisting.primary_phone || '+54 9 351 3090000';
  const romecoPhonesRaw = romecoExisting.phones_raw || '+54 9 351 3090000';

  const romecoPayload = {
    ...(romecoExisting.source_payload || {}),
    lat: -31.365582,
    lng: -64.1760597
  };

  await supabase.from('prospects').update({
    company_name: 'ROMECO Córdoba',
    address: 'Av. Juan B. Justo 4956',
    city: 'Córdoba',
    website: 'https://romeco.com.ar/',
    email: 'cordoba@romeco.com.ar',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=ROMECO+C%C3%B3rdoba+Av.+Juan+B.+Justo+4956+C%C3%B3rdoba+Argentina',
    sector: 'Venta y alquiler de maquinaria para construcción e industria; compactación, excavación y equipos de obra',
    commercial_category: 'Maquinaria construcción / Rental',
    class: 'A',
    visit_priority: 'A+',
    contact_status: 'pending',
    primary_phone: romecoPhone, // CONSERVADO
    phones_raw: romecoPhonesRaw, // CONSERVADO
    ask_for: 'Alquileres / Operaciones / Logística',
    probable_need: 'Muy alta: entregas y recuperos recurrentes de maquinaria de alquiler',
    suggested_action: 'Pedir responsable de Alquileres/Operaciones y consultar tercerización de transportes',
    pending_data: 'Horario: Lun–Vie 08:30–17:30 (ficha local) | CP: 5012 | Web oficial publica Av. Juan B. Justo 4956. Ficha previa mostraba Circunvalación 1180.',
    source_name: 'https://romeco.com.ar/nosotros-2/',
    evidence: 'https://ar.linkedin.com/company/romeco-rents',
    source_payload: romecoPayload,
    updated_at: new Date().toISOString()
  }).eq('id', romecoId);

  // Contacto en contacts
  const { data: romecoContacts } = await supabase.from('contacts').select('*').eq('prospect_id', romecoId);
  if (!romecoContacts || romecoContacts.length === 0) {
    await supabase.from('contacts').insert([{
      prospect_id: romecoId,
      full_name: 'Alquileres / Operaciones / Logística',
      role_title: 'Responsable Alquileres / Operaciones',
      phone: romecoPhone,
      whatsapp: romecoPhone,
      email: 'cordoba@romeco.com.ar',
      is_primary: true
    }]);
    console.log('  Contacto estructurado creado para ROMECO Córdoba.');
  } else {
    console.log(`  Contacto existente: ${romecoContacts[0].full_name}, Teléfono conservado: ${romecoContacts[0].phone}`);
  }
  console.log('  -> ROMECO Córdoba actualizado correctamente.');

  // -------------------------------------------------------------
  // 3. GROSSVIAL CÓRDOBA (NUEVO)
  // -------------------------------------------------------------
  console.log('\n--- 3. Creando Grossvial Córdoba ---');
  let grossvialId = null;
  const { data: grossvialExisting } = await supabase.from('prospects').select('id').ilike('company_name', '%Grossvial%');
  if (grossvialExisting && grossvialExisting.length > 0) {
    grossvialId = grossvialExisting[0].id;
    console.log('  Grossvial ya existe con id:', grossvialId);
  } else {
    const grossPayload = {
      external_id: 'CBA-085',
      company_name: 'Grossvial Córdoba',
      address: 'Av. de Circunvalación Agustín Tosco 4008',
      city: 'Córdoba',
      website: 'https://grossvial.com/',
      email: 'info@grossvial.com',
      google_maps_url: 'https://www.google.com/maps/search/?api=1&query=Grossvial+Av.+de+Circunvalaci%C3%B3n+Agust%C3%ADn+Tosco+4008+C%C3%B3rdoba+Argentina',
      sector: 'Fabricación y comercialización de maquinaria vial y agrícola; maquinaria New Holland, rental, service y repuestos',
      commercial_category: 'Maquinaria vial y agrícola / New Holland',
      class: 'A',
      visit_priority: 'A',
      contact_status: 'pending',
      primary_phone: '+54 351 306 7975',
      phones_raw: '+54 351 306 7975 / +54 9 3541 378779',
      ask_for: 'Despacho / Postventa / Comercial maquinaria',
      probable_need: 'Alta: entrega de maquinaria vendida, rental e ingreso/egreso por service',
      suggested_action: 'Consultar cómo resuelven entregas y movimientos de maquinaria; buscar despacho/postventa',
      pending_data: 'Horario: Lun–Jue 09:00–18:00; Vie 08:00–18:00 (ficha local) | CP: 5000',
      source_name: 'https://grossvial.com/contacto/',
      evidence: 'https://grossvial.com/landing/cajavolcadora/',
      source_payload: {
        lat: -31.4425347,
        lng: -64.1244913,
        maps_url: 'https://www.google.com/maps/search/?api=1&query=Grossvial+Av.+de+Circunvalaci%C3%B3n+Agust%C3%ADn+Tosco+4008+C%C3%B3rdoba+Argentina'
      }
    };

    const { data: newGross, error: grossErr } = await supabase.from('prospects').insert([grossPayload]).select().single();
    if (grossErr) {
      console.error('  Error insertando Grossvial:', grossErr);
    } else {
      grossvialId = newGross.id;
      console.log('  Grossvial creado exitosamente con ID:', grossvialId);

      await supabase.from('contacts').insert([{
        prospect_id: grossvialId,
        full_name: 'Despacho / Postventa / Comercial maquinaria',
        role_title: 'Despacho / Postventa',
        phone: '+54 351 306 7975',
        whatsapp: '+54 9 3541 378779',
        email: 'info@grossvial.com',
        is_primary: true
      }]);
      console.log('  Contacto estructurado creado para Grossvial.');
    }
  }

  // -------------------------------------------------------------
  // 4. INDUSTRIAS MG — POLO 52
  // -------------------------------------------------------------
  console.log('\n--- 4. Actualizando Industrias MG — Polo 52 ---');
  const mgId = 'a32d9eec-01f1-41a1-999b-3e16a9a0b439';
  const { data: mgExisting } = await supabase.from('prospects').select('primary_phone, phones_raw, source_payload').eq('id', mgId).single();

  const mgPhone = mgExisting.primary_phone || '+54 351 4704400';
  const mgPhonesRaw = mgExisting.phones_raw || '+54 351 4704400 / +54 351 4704404';

  const mgPayload = {
    ...(mgExisting.source_payload || {}),
    lat: -31.4215335,
    lng: -64.1026884
  };

  await supabase.from('prospects').update({
    company_name: 'Industrias MG — Polo 52',
    address: 'Polo 52 Parque Industrial – Autopista Córdoba–Rosario, a 500 m de Av. Circunvalación',
    city: 'Córdoba',
    website: 'https://industrias-mg.com.ar/',
    email: 'info@industrias-mg.com.ar',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=Industrias+MG+Polo+52+C%C3%B3rdoba+Argentina',
    sector: 'Venta, alquiler y service de maquinaria vial e industrial; autoelevadores, plataformas, manipuladores y equipos pesados',
    commercial_category: 'Maquinaria vial e industrial / Rental',
    class: 'A',
    visit_priority: 'A+',
    contact_status: 'pending',
    primary_phone: mgPhone, // CONSERVADO
    phones_raw: mgPhonesRaw, // CONSERVADO
    ask_for: 'Alquileres / Logística / Postventa',
    probable_need: 'Muy alta: venta + alquiler + service generan traslados recurrentes',
    suggested_action: 'Pedir responsable de alquiler/logística; relevar movimientos mensuales y destinos',
    pending_data: 'Horario: Lun–Vie 08:30–18:00; Sáb 08:30–12:30 | Dos sucursales: Centro (Juan B. Justo 4730) y Polo 52.',
    source_name: 'https://industrias-mg.com.ar/contacto/',
    evidence: 'https://industrias-mg.com.ar/',
    source_payload: mgPayload,
    updated_at: new Date().toISOString()
  }).eq('id', mgId);

  const { data: mgContacts } = await supabase.from('contacts').select('*').eq('prospect_id', mgId);
  if (!mgContacts || mgContacts.length === 0) {
    await supabase.from('contacts').insert([{
      prospect_id: mgId,
      full_name: 'Alquileres / Logística / Postventa',
      role_title: 'Responsable Alquileres / Logística',
      phone: mgPhone,
      email: 'info@industrias-mg.com.ar',
      is_primary: true
    }]);
    console.log('  Contacto estructurado creado para Industrias MG.');
  } else {
    console.log(`  Contacto existente: ${mgContacts[0].full_name}, Teléfono conservado: ${mgContacts[0].phone}`);
  }
  console.log('  -> Industrias MG — Polo 52 actualizado correctamente.');

  // -------------------------------------------------------------
  // 5. MÁQUINAS DEL CENTRO — CASE IH (CÓRDOBA)
  // -------------------------------------------------------------
  console.log('\n--- 5. Actualizando Máquinas del Centro — Case IH ---');
  const mdcId = 'dcf29e76-6593-4a0f-ab21-261c81ca09f5';
  const { data: mdcExisting } = await supabase.from('prospects').select('primary_phone, phones_raw, source_payload').eq('id', mdcId).single();

  const mdcPhone = mdcExisting.primary_phone || '0351 7015555';
  const mdcPhonesRaw = mdcExisting.phones_raw || '0351 7015555 / 0351 8722584';

  const mdcPayload = {
    ...(mdcExisting.source_payload || {}),
    lat: -31.4215335,
    lng: -64.1026884
  };

  await supabase.from('prospects').update({
    company_name: 'Máquinas del Centro — Case IH',
    address: 'Autopista Córdoba–Rosario km 701, Parque Industrial Polo 52',
    city: 'Córdoba',
    website: 'https://www.maquinasdelcentro.com.ar/',
    email: 'mauricio@maquinasdelcentro.com.ar',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=M%C3%A1quinas+del+Centro+C%C3%B3rdoba+Polo+52+Autopista+C%C3%B3rdoba+Rosario+km+701',
    sector: 'Concesionario de maquinaria agrícola: CASE IH, Crucianelli, Maizco y Toolking; tractores, cosechadoras, sembradoras, usados y service',
    commercial_category: 'Maquinaria agrícola / Case IH',
    class: 'A',
    visit_priority: 'A',
    contact_status: 'pending',
    primary_phone: mdcPhone, // CONSERVADO
    phones_raw: mdcPhonesRaw, // CONSERVADO
    ask_for: 'Mauricio (Ventas) / Gerencia sucursal / Logística / Usados / Service',
    probable_need: 'Alta: movimientos de tractores, implementos, usados y equipos compatibles con carretón/camilla',
    suggested_action: 'Consultar transporte de entregas y movimientos entre sucursales/cliente; calificar pesos y dimensiones',
    pending_data: 'Horario: Lun–Vie 08:00–18:00 | Service Córdoba: +54 9 3518 922222 | Ventas Córdoba: 351 8722584 | WA general: +54 9 3564 567788',
    source_name: 'https://www.maquinasdelcentro.com.ar/contacto',
    evidence: 'https://www.maquinasdelcentro.com.ar/servicios',
    source_payload: mdcPayload,
    updated_at: new Date().toISOString()
  }).eq('id', mdcId);

  const { data: mdcContacts } = await supabase.from('contacts').select('*').eq('prospect_id', mdcId);
  if (!mdcContacts || mdcContacts.length === 0) {
    await supabase.from('contacts').insert([{
      prospect_id: mdcId,
      full_name: 'Mauricio',
      role_title: 'Ventas Córdoba',
      phone: '+54 351 8722584',
      whatsapp: '+54 9 3564 567788',
      email: 'mauricio@maquinasdelcentro.com.ar',
      is_primary: true
    }]);
    console.log('  Contacto estructurado creado para Mauricio (Ventas Córdoba).');
  } else {
    console.log(`  Contacto existente: ${mdcContacts[0].full_name}, Teléfono conservado: ${mdcContacts[0].phone}`);
  }
  console.log('  -> Máquinas del Centro — Case IH actualizado correctamente.');

  // -------------------------------------------------------------
  // 6. GRUMAQ — SUCURSAL CÓRDOBA
  // -------------------------------------------------------------
  console.log('\n--- 6. Actualizando GRUMAQ — Sucursal Córdoba ---');
  const grumaqId = '2c478f80-2bc6-42d5-870b-001d962c8841';
  const { data: grumaqExisting } = await supabase.from('prospects').select('primary_phone, phones_raw, source_payload').eq('id', grumaqId).single();

  const grumaqPhone = grumaqExisting.primary_phone || '0810-555-4767';
  const grumaqPhonesRaw = grumaqExisting.phones_raw || '0810-555-4767';

  const grumaqPayload = {
    ...(grumaqExisting.source_payload || {}),
    lat: -31.3574799,
    lng: -64.1799633
  };

  await supabase.from('prospects').update({
    company_name: 'GRUMAQ — Sucursal Córdoba',
    address: 'Av. Circunvalación Colectora Norte S/N, entre Rancagua y Capdevila',
    city: 'Córdoba',
    website: 'https://grumaq.com.ar/',
    email: 'info@grumaq.com.ar',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=GRUMAQ+C%C3%B3rdoba+Av.+Circunvalaci%C3%B3n+Colectora+Norte+Rancagua+Capdevila+C%C3%B3rdoba',
    sector: 'Maquinaria para construcción e industria; CASE Construction, motores FPT, venta, alquiler, repuestos y servicio técnico',
    commercial_category: 'Maquinaria construcción / CASE Construction',
    class: 'A',
    visit_priority: 'A+',
    contact_status: 'pending',
    primary_phone: grumaqPhone, // CONSERVADO
    phones_raw: grumaqPhonesRaw, // CONSERVADO
    ask_for: 'Rental / Service / Operaciones / Gerencia',
    probable_need: 'Muy alta: venta, alquiler y service de maquinaria vial CASE',
    suggested_action: 'Solicitar alta como proveedor de respaldo y relevar operadores actuales de transporte',
    pending_data: 'Horario: Lun–Vie 08:00–16:45 (ficha local) | CP: 5000',
    source_name: 'https://grumaq.com.ar/',
    evidence: 'https://grumaq.com.ar/institucional/',
    source_payload: grumaqPayload,
    updated_at: new Date().toISOString()
  }).eq('id', grumaqId);

  const { data: grumaqContacts } = await supabase.from('contacts').select('*').eq('prospect_id', grumaqId);
  if (!grumaqContacts || grumaqContacts.length === 0) {
    await supabase.from('contacts').insert([{
      prospect_id: grumaqId,
      full_name: 'Rental / Service / Operaciones / Gerencia',
      role_title: 'Responsable Rental / Operaciones',
      phone: grumaqPhone,
      email: 'info@grumaq.com.ar',
      is_primary: true
    }]);
    console.log('  Contacto estructurado creado para GRUMAQ.');
  } else {
    console.log(`  Contacto existente: ${grumaqContacts[0].full_name}, Teléfono conservado: ${grumaqContacts[0].phone}`);
  }
  console.log('  -> GRUMAQ — Sucursal Córdoba actualizado correctamente.');

  // -------------------------------------------------------------
  // 7. MAYORISTA BÁLSAMO SA
  // -------------------------------------------------------------
  console.log('\n--- 7. Actualizando Mayorista Bálsamo SA ---');
  const balsamoId = '069d0184-9200-4382-b526-f8e41d2365ab';
  const { data: balsamoExisting } = await supabase.from('prospects').select('primary_phone, phones_raw, source_payload').eq('id', balsamoId).single();
  const { data: balsamoContacts } = await supabase.from('contacts').select('*').eq('prospect_id', balsamoId);

  // Regla estricta: Conservar el contacto de teléfono guardado (Fabian Serveto: +5493516411502)
  let preservedBalsamoPhone = null;
  if (balsamoContacts && balsamoContacts.length > 0) {
    const fabian = balsamoContacts[0];
    preservedBalsamoPhone = fabian.phone;
    console.log(`  Contacto existente: ${fabian.full_name}, Teléfono conservado estricto: ${fabian.phone}`);
    if (!fabian.email) {
      await supabase.from('contacts').update({ email: 'ventas@balsamo.com.ar' }).eq('id', fabian.id);
    }
  }

  const finalBalsamoPhone = preservedBalsamoPhone || '+54 351 492 9000';
  const finalBalsamoRaw = preservedBalsamoPhone
    ? `${preservedBalsamoPhone} (Fabian Serveto - Dueño) / +54 351 492 9000 (Fijo central)`
    : '+54 351 492 9000';

  const balsamoPayload = {
    ...(balsamoExisting.source_payload || {}),
    lat: -31.3624958,
    lng: -64.1477803
  };

  await supabase.from('prospects').update({
    company_name: 'Mayorista Bálsamo SA',
    address: 'Av. Circunvalación y Rancagua',
    city: 'Córdoba',
    website: 'https://balsamo.com.ar/',
    email: 'ventas@balsamo.com.ar',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=B%C3%A1lsamo+SA+Av.+Circunvalaci%C3%B3n+y+Rancagua+C%C3%B3rdoba+Argentina',
    sector: 'Distribución mayorista de autopartes; repuestos Renault, Volkswagen y Nissan; operación logística',
    commercial_category: 'Autopartes y logística mayorista',
    class: 'B',
    visit_priority: 'B',
    contact_status: 'interested',
    primary_phone: finalBalsamoPhone, // CONSERVADO / VINCULADO AL CONTACTO GUARDADO
    phones_raw: finalBalsamoRaw,
    ask_for: 'Fabian Serveto (Dueño) / Operaciones / Logística / Mantenimiento',
    probable_need: 'Media: movimientos extraordinarios de autoelevadores, equipamiento de depósito y maquinaria interna',
    suggested_action: 'Reunión: identificar equipos internos y cómo gestionan traslados externos/extraordinarios',
    pending_data: 'Horario: Lun–Vie 08:00–17:00 | CP: 5012 | Contacto directo Dueño: Fabian Serveto (+5493516411502)',
    source_name: 'https://balsamo.com.ar/',
    evidence: 'Ficha local Mayorista Bálsamo SA | Web oficial',
    source_payload: balsamoPayload,
    updated_at: new Date().toISOString()
  }).eq('id', balsamoId);
  console.log('  -> Mayorista Bálsamo SA actualizado correctamente.');

  // -------------------------------------------------------------
  // 8. CREACIÓN / ACTUALIZACIÓN DE LA GIRA (TRIP) 2026-10-01
  // -------------------------------------------------------------
  console.log('\n--- 8. Creando / Actualizando Gira 2026-10-01 en trips ---');
  const tripDate = '2026-10-01';
  let tripId = null;

  const { data: existingTrips } = await supabase.from('trips').select('id, name').eq('trip_date', tripDate);
  if (existingTrips && existingTrips.length > 0) {
    tripId = existingTrips[0].id;
    console.log(`  Gira existente para ${tripDate} encontrada (ID: ${tripId}). Se actualizarán sus paradas.`);
  } else {
    const { data: newTrip, error: tripErr } = await supabase.from('trips').insert([{
      name: 'Gira Córdoba — 01/10/2026',
      description: 'Gira comercial Córdoba: 7 paradas planificadas (Sullair, ROMECO, Grossvial, Industrias MG, Máquinas del Centro, GRUMAQ, Mayorista Bálsamo)',
      status: 'planned',
      trip_date: tripDate,
      owner_id: adminId,
      created_by: adminId
    }]).select().single();

    if (tripErr) {
      console.error('  Error creando trip:', tripErr);
    } else {
      tripId = newTrip.id;
      console.log(`  Gira creada con éxito: ${newTrip.name} (ID: ${tripId})`);
    }
  }

  if (tripId && grossvialId) {
    // Paradas ordenadas de la agenda
    const stops = [
      {
        order: 1,
        prospect_id: sullairId,
        planned_at: '2026-10-01T10:00:00-03:00',
        route_note: '10:00 | REUNIÓN CONFIRMADA | Objetivo: Rental / Operaciones / Logística: quedar como proveedor de respaldo'
      },
      {
        order: 2,
        prospect_id: romecoId,
        planned_at: '2026-10-01T10:55:00-03:00',
        route_note: '10:55 | Prospección | Objetivo: Pedir Alquileres/Operaciones; validar tercerización de transporte'
      },
      {
        order: 3,
        prospect_id: grossvialId,
        planned_at: '2026-10-01T11:25:00-03:00',
        route_note: '11:25 | Prospección | Objetivo: Despacho/Postventa; entregas y service'
      },
      {
        order: 4,
        prospect_id: mgId,
        planned_at: '2026-10-01T12:00:00-03:00',
        route_note: '12:00 | Prospección clave | Objetivo: Alquileres/Logística; frecuencia y destinos'
      },
      {
        order: 5,
        prospect_id: mdcId,
        planned_at: '2026-10-01T12:30:00-03:00',
        route_note: '12:30 | Prospección | Objetivo: Logística/Usados/Service; movimientos compatibles'
      },
      {
        order: 6,
        prospect_id: grumaqId,
        planned_at: '2026-10-01T13:45:00-03:00',
        route_note: '13:45 | Prospección clave | Objetivo: Rental/Service; alta como proveedor de respaldo'
      },
      {
        order: 7,
        prospect_id: balsamoId,
        planned_at: '2026-10-01T15:00:00-03:00',
        route_note: '15:00 | REUNIÓN CONFIRMADA | Objetivo: Operaciones/Logística; detectar movimientos extraordinarios'
      }
    ];

    // Eliminar paradas existentes previas para este trip si existieran y reinsertar limpias en orden
    await supabase.from('trip_stops').delete().eq('trip_id', tripId);

    for (const stop of stops) {
      const { error: stopErr } = await supabase.from('trip_stops').insert([{
        trip_id: tripId,
        prospect_id: stop.prospect_id,
        stop_order: stop.order,
        status: 'pending',
        planned_at: stop.planned_at,
        route_note: stop.route_note
      }]);
      if (stopErr) {
        console.error(`  Error insertando parada ${stop.order}:`, stopErr);
      } else {
        console.log(`  Parada ${stop.order} (${stop.planned_at.slice(11, 16)}) insertada.`);
      }
    }
  }

  console.log('\n=== PROCESO COMPLETADO EXITOSAMENTE ===');
}

run();
