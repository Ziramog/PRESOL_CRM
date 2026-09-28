/**
 * PRESOL CRM — Prospect Search Engine
 * Búsqueda amplia y tolerante sobre la ficha general del prospecto y sus contactos asociados.
 */

/**
 * Sanitiza el término de búsqueda removiendo caracteres que rompen
 * la sintaxis de filtros lógicos en PostgREST (, ( ) " : \).
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input) return '';
  return input.replace(/[,()":\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Genera una lista de expresiones de filtro `.or(...)` para Supabase PostgREST
 * cubriendo todos los campos de la ficha general del prospecto y contactos vinculados.
 * Si la consulta contiene múltiples palabras (ej. "Gemelo Villa"), cada token genera
 * una cláusula OR independiente que al encadenarse en la query actúan como AND acumulativo.
 */
export async function getProspectSearchFilters(
  supabase: any,
  rawQuery: string
): Promise<string[]> {
  const clean = sanitizeSearchQuery(rawQuery);
  if (!clean) return [];

  // Limitar a máximo 5 tokens para evitar consultas excesivas
  const tokens = clean.split(/\s+/).filter(t => t.length > 0).slice(0, 5);
  if (tokens.length === 0) return [];

  const filters: string[] = [];

  // Hacer las consultas de contactos en paralelo
  const contactQueries = tokens.map(token => 
    supabase
      .from('contacts')
      .select('prospect_id')
      .or(`full_name.ilike.%${token}%,phone.ilike.%${token}%,email.ilike.%${token}%,role_title.ilike.%${token}%`)
      .limit(50)
      .then((res: any) => ({ token, data: res.data }))
      .catch((err: any) => {
        console.warn('Error querying contacts for search token:', token, err);
        return { token, data: [] };
      })
  );

  const contactsResults = await Promise.all(contactQueries);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const matchedContacts = contactsResults[i].data;
    
    let matchedProspectIds = (matchedContacts || [])
      .map((c: any) => c.prospect_id)
      .filter(Boolean);

    // 2. Construir lista de campos del prospecto a contrastar
    const fields = [
      `company_name.ilike.%${token}%`,
      `external_id.ilike.%${token}%`,
      `ask_for.ilike.%${token}%`,
      `city.ilike.%${token}%`,
      `address.ilike.%${token}%`,
      `primary_phone.ilike.%${token}%`,
      `phones_raw.ilike.%${token}%`,
      `email.ilike.%${token}%`,
      `cuit.ilike.%${token}%`,
      `commercial_category.ilike.%${token}%`,
      `sector.ilike.%${token}%`
    ];

    if (matchedProspectIds.length > 0) {
      const uniqueIds = Array.from(new Set(matchedProspectIds));
      fields.push(`id.in.(${uniqueIds.join(',')})`);
    }

    filters.push(fields.join(','));
  }

  return filters;
}
