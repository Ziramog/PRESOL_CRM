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

    const formattedImage = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Call OpenAI Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente experto en lectura y extracción de tarjetas de presentación comercial (Business Cards), especialmente en Argentina y Latinoamérica.
Tu tarea es leer minuciosamente todo el texto de la tarjeta, incluso si está inclinada, con poca luz o tipografía pequeña.
Extrae la información y devuelve un JSON estricto con los siguientes campos (usa "" si no se encuentra alguno):
- companyName: Nombre comercial o razón social de la empresa
- contactName: Nombre completo del contacto (Persona física)
- roleTitle: Cargo, puesto o función (ej: Gerente Comercial, Dueño, Alquileres, Operaciones, Ventas)
- email: Correo electrónico principal de la persona o comercial
- phone: Teléfono celular/WhatsApp o principal formateado (si es de Argentina conserva código de área ej: +54 9 351 ... o fijo 0351...)
- secondaryPhone: Teléfono secundario o rotativo si figura
- address: Dirección física o localidad si figura
- website: Sitio web o dominio si figura

Instrucciones adicionales:
1. No confundas el nombre de la empresa con el nombre de la persona.
2. Si hay un prefijo como "Cel:", "Wsp:", "WhatsApp:", "Móvil:", "Tel:", prioriza el celular o WhatsApp en el campo 'phone'.
3. Devuelve EXCLUSIVAMENTE un JSON válido.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extrae con máxima precisión los datos de esta tarjeta de presentación.' },
            {
              type: 'image_url',
              image_url: {
                url: formattedImage,
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
      throw new Error('No se recibió respuesta del modelo de visión.');
    }

    const data = JSON.parse(resultText);
    
    // Clean up parsed data
    const companyName = (data.companyName || '').trim();
    let emailDomain = '';
    if (data.email) {
      const parts = data.email.split('@');
      if (parts.length === 2) {
        emailDomain = parts[1].toLowerCase().trim();
        const genericDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
        if (genericDomains.includes(emailDomain)) {
          emailDomain = '';
        }
      }
    }

    // Check if company exists safely without breaking PostgREST syntax
    let existingCompany = null;
    try {
      const supabase = await createAdminClient();
      if (companyName || emailDomain) {
        const cleanName = companyName.replace(/[,()":\\%]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanName.length >= 3) {
          const { data: foundProspects } = await supabase
            .from('prospects')
            .select('id, company_name, city, commercial_category')
            .ilike('company_name', `%${cleanName}%`)
            .limit(1);

          if (foundProspects && foundProspects.length > 0) {
            existingCompany = foundProspects[0];
          }
        }
        
        // Si no encontró por nombre y hay dominio corporativo, probar por email
        if (!existingCompany && emailDomain) {
          const { data: foundByEmail } = await supabase
            .from('prospects')
            .select('id, company_name, city, commercial_category')
            .ilike('email', `%@${emailDomain}`)
            .limit(1);

          if (foundByEmail && foundByEmail.length > 0) {
            existingCompany = foundByEmail[0];
          }
        }
      }
    } catch (dbErr) {
      console.warn('Error verificando empresa existente en tarjeta:', dbErr);
    }

    return NextResponse.json({
      success: true,
      parsed: {
        companyName: data.companyName || '',
        contactName: data.contactName || '',
        roleTitle: data.roleTitle || '',
        email: data.email || '',
        phone: data.phone || data.secondaryPhone || '',
        secondaryPhone: data.secondaryPhone || '',
        address: data.address || '',
        website: data.website || '',
      },
      existingCompany,
    });

  } catch (error: any) {
    console.error('Error processing business card:', error);
    return NextResponse.json({ error: error.message || 'Error procesando la tarjeta' }, { status: 500 });
  }
}
