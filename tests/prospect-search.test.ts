import test from 'node:test';
import assert from 'node:assert';
import { sanitizeSearchQuery, getProspectSearchFilters } from '../src/lib/prospects/search';

test('1. sanitizeSearchQuery elimina caracteres que rompen el AST de PostgREST', () => {
  const dirty = 'Gemelo, Maquinarias (Córdoba): "RN158" \\ test';
  const clean = sanitizeSearchQuery(dirty);
  assert.strictEqual(clean, 'Gemelo Maquinarias Córdoba RN158 test');
});

test('2. sanitizeSearchQuery preserva códigos y guiones como MAN-1789592512178', () => {
  const code = 'MAN-1789592512178';
  const clean = sanitizeSearchQuery(code);
  assert.strictEqual(clean, 'MAN-1789592512178');
});

test('3. sanitizeSearchQuery maneja cadenas vacías o espacios', () => {
  assert.strictEqual(sanitizeSearchQuery(''), '');
  assert.strictEqual(sanitizeSearchQuery('   '), '');
});

test('4. getProspectSearchFilters genera condiciones OR para campos clave', async () => {
  // Mock simple de Supabase
  const mockSupabase = {
    from: () => ({
      select: () => ({
        or: () => ({
          limit: async () => ({ data: [], error: null })
        })
      })
    })
  };

  const filters = await getProspectSearchFilters(mockSupabase, 'MAN-1789592512178');
  assert.strictEqual(filters.length, 1);
  const f = filters[0];

  assert.ok(f.includes('company_name.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('external_id.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('ask_for.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('city.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('address.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('primary_phone.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('phones_raw.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('email.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('cuit.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('commercial_category.ilike.%MAN-1789592512178%'));
  assert.ok(f.includes('sector.ilike.%MAN-1789592512178%'));
});

test('5. getProspectSearchFilters incluye IDs de contactos encontrados', async () => {
  const mockSupabase = {
    from: () => ({
      select: () => ({
        or: () => ({
          limit: async () => ({
            data: [
              { prospect_id: 'pid-1' },
              { prospect_id: 'pid-2' },
              { prospect_id: 'pid-1' } // Duplicado debe filtrarse
            ],
            error: null
          })
        })
      })
    })
  };

  const filters = await getProspectSearchFilters(mockSupabase, 'Carlos');
  assert.strictEqual(filters.length, 1);
  assert.ok(filters[0].includes('id.in.(pid-1,pid-2)'));
});

test('6. getProspectSearchFilters divide tokens múltiples y limita a 5', async () => {
  const mockSupabase = {
    from: () => ({
      select: () => ({
        or: () => ({
          limit: async () => ({ data: [], error: null })
        })
      })
    })
  };

  const filters = await getProspectSearchFilters(mockSupabase, 'uno dos tres cuatro cinco seis siete');
  assert.strictEqual(filters.length, 5);
  assert.ok(filters[0].includes('%uno%'));
  assert.ok(filters[4].includes('%cinco%'));
});
