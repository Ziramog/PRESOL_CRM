const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function run() {
  const prospectId = '069d0184-9200-4382-b526-f8e41d2365ab';
  const { data: prospect, error } = await supabase.from('prospects').select('*').eq('id', prospectId).single();
  if (error) { console.error('Supabase error:', error); return; }
  console.log('Prospect:', prospect.company_name);
  
  const systemPrompt = `
Sos un asistente experto en enriquecimiento de datos de ventas (CRM).
Tu objetivo es analizar los datos crudos y sucios de un prospecto y extraer información limpia y estructurada.

Reglas:
1. 'primary_phone': Extraé y limpiá el número de teléfono principal (agregale el código de país +54 si parece de Argentina, sacale los espacios y caracteres extraños).
2. 'city': Si se menciona una ciudad en las notas (ej. "Río Tercero", "CABA"), extraela. 
3. 'sector': Inferí el rubro o categoría comercial (ej. "Maquinaria Agrícola", "Logística", "Software") a partir de la evidencia o el nombre de la empresa.
4. 'class': Si podés inferir el tamaño o importancia (A, B, C), asignalo. Si no estás seguro, dejalo nulo.
5. 'probable_need': Si la evidencia menciona un problema que la empresa resuelve, resumilo.

Si algún dato no se puede inferir con seguridad absoluta, devolvé null para ese campo.
`;

  const userMessage = `
Datos del prospecto:
- Nombre Empresa: ${prospect.company_name}
- Teléfonos crudos: ${prospect.phones_raw || ''}
- Evidencia / Notas: ${prospect.evidence || ''}
- Datos pendientes: ${prospect.pending_data || ''}
- Ciudad actual: ${prospect.city || ''}
- Rubro actual: ${prospect.sector || prospect.commercial_category || ''}
`;

  console.log('Sending to OpenAI...');
  try {
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
              primary_phone: { type: ['string', 'null'], description: 'Teléfono principal' },
              city: { type: ['string', 'null'], description: 'Ciudad' },
              sector: { type: ['string', 'null'], description: 'Rubro' },
              class: { type: ['string', 'null'], enum: ['A', 'B', 'C', null], description: 'Clase' },
              probable_need: { type: ['string', 'null'], description: 'Necesidad' }
            },
            required: ['primary_phone', 'city', 'sector', 'class', 'probable_need'],
            additionalProperties: false
          }
        }
      },
      temperature: 0.1,
    });
    
    console.log('AI Response:', completion.choices[0].message.content);
  } catch (e) {
    console.error('OpenAI error:', e);
  }
}
run();
