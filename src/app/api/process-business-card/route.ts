import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60; // Allow more time for API and DB operations

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Falta la imagen base64' }, { status: 400 });
    }

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente experto en lectura de tarjetas de presentación (Business Cards).
Tu tarea es extraer la información de la imagen de la tarjeta y devolver un JSON estricto con los siguientes campos (usa null si no se encuentra alguno):
- companyName: Nombre de la empresa
- contactName: Nombre completo de la persona
- roleTitle: Cargo o puesto
- email: Correo electrónico
- phone: Teléfono
Devuelve SOLO JSON válido.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extrae los datos de esta tarjeta de presentación.' },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
                detail: 'high',
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const resultText = response.choices[0].message.content;
    if (!resultText) {
      throw new Error('No response from OpenAI');
    }

    const data = JSON.parse(resultText);
    
    // Clean up parsed data
    const companyName = data.companyName || '';
    let emailDomain = '';
    if (data.email) {
      const parts = data.email.split('@');
      if (parts.length === 2) {
        emailDomain = parts[1].toLowerCase();
        // Ignore generic domains
        const genericDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
        if (genericDomains.includes(emailDomain)) {
          emailDomain = '';
        }
      }
    }

    const supabase = await createAdminClient();
    
    // Check if the company exists
    let existingCompany = null;

    if (companyName || emailDomain) {
      let query = supabase.from('prospects').select('id, company_name');
      
      if (emailDomain && companyName) {
         // This is a bit tricky, Supabase query doesn't easily do OR across non-json without or() string
         query = query.or(`company_name.ilike.%${companyName}%,email.ilike.%@${emailDomain}`);
      } else if (companyName) {
         query = query.ilike('company_name', `%${companyName}%`);
      } else if (emailDomain) {
         query = query.ilike('email', `%@${emailDomain}`);
      }
      
      const { data: foundProspects, error } = await query.limit(1);

      if (foundProspects && foundProspects.length > 0) {
        existingCompany = foundProspects[0];
      }
    }

    return NextResponse.json({
      parsed: {
        companyName: data.companyName || '',
        contactName: data.contactName || '',
        roleTitle: data.roleTitle || '',
        email: data.email || '',
        phone: data.phone || '',
      },
      existingCompany,
    });

  } catch (error: any) {
    console.error('Error processing business card:', error);
    return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
  }
}
