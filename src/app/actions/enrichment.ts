'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import OpenAI from 'openai';

export async function enrichProspectAuto(prospectId: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { error: 'Falta configurar la clave OPENAI_API_KEY en el servidor.' };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const supabase = await createAdminClient();
    
    // 1. Fetch prospect data
    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('company_name, phones_raw, primary_phone, city, sector, class, commercial_category, ask_for, probable_need, presol_offer, sales_hook, pending_data, evidence, source_name, email, google_maps_url, website, address')
      .eq('id', prospectId)
      .single();
      
    if (fetchError || !prospect) {
      return { error: 'No se encontró el prospecto' };
    }

    // 1.5 Fetch comments (notes)
    const { data: commentsData } = await supabase
      .from('comments')
      .select('content')
      .eq('prospect_id', prospectId)
      .is('deleted_at', null);

    const commentsText = commentsData?.map(c => c.content).join(' | ') || '';

    // 2. Build the prompt
    const systemPrompt = `
Sos un asistente experto en enriquecimiento de datos de ventas (CRM).
Tu objetivo es analizar los datos crudos de un prospecto (y tus propios conocimientos sobre la empresa si es conocida) para extraer información limpia y estructurada.

Reglas:
1. 'primary_phone': Extraé y limpiá el número de teléfono principal (agregale el código de país +54 si es Argentina). Si el prospecto no tiene uno, pero lo sabés por tu conocimiento general, agregalo.
2. 'city': Si se menciona una ciudad en las notas (ej. "Río Tercero"), extraela. Si no, inferila usando tu conocimiento sobre la empresa.
3. 'sector': Inferí el rubro comercial (ej. "Maquinaria Agrícola", "Logística") a partir del nombre, notas, o tu conocimiento.
4. 'class': Si podés inferir el tamaño (A, B, C), asignalo.
5. 'probable_need': Si la evidencia menciona un problema, resumilo.

¡IMPORTANTE! Si los datos crudos están vacíos, usá tu base de conocimientos (entrenamiento) para tratar de adivinar el sector, ciudad o teléfono de la empresa basándote en su "Nombre Empresa".
Si es imposible inferir un dato, devolvé null.
`;

    const userMessage = `
Datos del prospecto:
- Nombre Empresa: ${prospect.company_name}
- Web / Maps: ${prospect.website || ''} ${prospect.google_maps_url || ''}
- Dirección: ${prospect.address || ''}
- Teléfonos crudos: ${prospect.phones_raw || ''}
- Evidencia / Notas: ${prospect.evidence || ''}
- Datos pendientes: ${prospect.pending_data || ''}
- Historial de Comentarios: ${commentsText}
- Ciudad actual: ${prospect.city || ''}
- Rubro actual: ${prospect.sector || prospect.commercial_category || ''}
`;

    // 3. Call OpenAI with Structured Outputs
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'prospect_enrichment',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              primary_phone: { type: ['string', 'null'], description: 'Teléfono principal limpio y con formato' },
              city: { type: ['string', 'null'], description: 'Ciudad principal' },
              sector: { type: ['string', 'null'], description: 'Rubro principal de la empresa' },
              class: { type: ['string', 'null'], enum: ['A', 'B', 'C', null], description: 'Clase del prospecto' },
              probable_need: { type: ['string', 'null'], description: 'Resumen de la necesidad del prospecto' }
            },
            required: ['primary_phone', 'city', 'sector', 'class', 'probable_need'],
            additionalProperties: false
          }
        }
      },
      temperature: 0.1,
    });

    const resultText = completion.choices[0]?.message?.content;
    if (!resultText) {
      return { error: 'OpenAI no devolvió una respuesta válida.' };
    }

    const extractedData = JSON.parse(resultText);

    // 4. Update the prospect, but only override fields that were previously empty or null, 
    // unless the AI found a very confident extraction for a dirty field (like phones_raw -> primary_phone)
    const updates: any = {};
    if (extractedData.primary_phone && !prospect.primary_phone) updates.primary_phone = extractedData.primary_phone;
    if (extractedData.city && !prospect.city) updates.city = extractedData.city;
    if (extractedData.sector && !prospect.sector) updates.sector = extractedData.sector;
    if (extractedData.class && !prospect.class) updates.class = extractedData.class;
    if (extractedData.probable_need && !prospect.probable_need) updates.probable_need = extractedData.probable_need;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('prospects')
        .update(updates)
        .eq('id', prospectId);
        
      if (updateError) {
        return { error: 'Error al actualizar la base de datos: ' + updateError.message };
      }
    }

    // 5. Revalidate
    revalidatePath(`/prospects/${prospectId}`);
    revalidatePath('/prospects');

    return { success: true, updates };

  } catch (error: any) {
    console.error('AI Enrichment Error:', error);
    return { error: error.message || 'Error desconocido durante el enriquecimiento.' };
  }
}
