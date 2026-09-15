import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as xlsx from 'xlsx';
import { CONTACT_LEVELS, ACTIVITY_RESULTS } from '@/lib/constants';

export async function GET() {
  const supabase = createClient();

  // Fetch all prospects and their activities
  const { data: prospects, error } = await supabase
    .from('prospects')
    .select(`
      *,
      activities (
        notes,
        summary,
        outcome,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error || !prospects) {
    return NextResponse.json({ error: 'Failed to fetch prospects' }, { status: 500 });
  }

  // Format data for Excel
  const excelData = prospects.map((p) => {
    // Sort activities for this prospect by date descending to get the latest
    const sortedActivities = p.activities?.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ) || [];

    const lastActivity = sortedActivities[0];
    let lastInteractionDate = '';
    let lastInteractionSummary = '';

    if (lastActivity) {
      lastInteractionDate = new Date(lastActivity.created_at).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });

      // Prefer notes, fallback to translated summary/outcome
      if (lastActivity.notes) {
        lastInteractionSummary = lastActivity.notes;
      } else if (lastActivity.summary) {
        lastInteractionSummary = CONTACT_LEVELS[lastActivity.summary as keyof typeof CONTACT_LEVELS] || lastActivity.summary;
      } else if (lastActivity.outcome) {
        lastInteractionSummary = ACTIVITY_RESULTS[lastActivity.outcome as keyof typeof ACTIVITY_RESULTS] || lastActivity.outcome;
      }
    }

    return {
      'ID CRM': p.external_id || p.id.split('-')[0],
      'Empresa': p.company_name,
      'Ciudad': p.city || '',
      'Clase': p.class || '',
      'Score Op.': p.operational_score || '',
      'Corredor / Zona': p.corridor || '',
      'Categoría': p.commercial_category || '',
      'Teléfonos': p.phones_raw || p.primary_phone || '',
      'Dirección': p.address || '',
      'Estado Actual': p.contact_status || '',
      'Prioridad Visita': p.visit_priority || '',
      'Necesidad Probable': p.probable_need || '',
      'Última Interacción (Fecha)': lastInteractionDate,
      'Última Interacción (Resumen)': lastInteractionSummary
    };
  });

  // Create workbook
  const worksheet = xlsx.utils.json_to_sheet(excelData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Prospectos');

  // Adjust column widths
  const wscols = [
    { wch: 10 }, // ID
    { wch: 30 }, // Empresa
    { wch: 15 }, // Ciudad
    { wch: 8 },  // Clase
    { wch: 10 }, // Score
    { wch: 20 }, // Corredor
    { wch: 25 }, // Categoria
    { wch: 20 }, // Telefonos
    { wch: 30 }, // Dirección
    { wch: 15 }, // Estado
    { wch: 20 }, // Prioridad
    { wch: 35 }, // Necesidad
    { wch: 20 }, // Fecha
    { wch: 50 }, // Resumen
  ];
  worksheet['!cols'] = wscols;

  // Generate buffer
  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  const headers = new Headers();
  // Get current date for filename
  const dateStr = new Date().toISOString().split('T')[0];
  headers.append('Content-Disposition', `attachment; filename="PRESOL_Prospectos_${dateStr}.xlsx"`);
  headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  return new NextResponse(excelBuffer, {
    status: 200,
    headers,
  });
}

