'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart2, X, Activity, History, ArrowRight } from 'lucide-react';
import { ProspectForm } from '@/components/crm/prospect-form';
import {
  MANAGEMENT_STATUS,
  COMMERCIAL_STAGE,
  MANAGEMENT_STYLE,
  STAGE_STYLE,
  DISCARD_REASONS,
  ManagementStatus,
  CommercialStage,
  DiscardReason,
} from '@/lib/constants';

interface CommercialStatusCardProps {
  prospect: any;
  latestActivity?: any;
  statusHistory?: any[];
}

export function CommercialStatusCard({
  prospect,
  latestActivity,
  statusHistory = [],
}: CommercialStatusCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const mgmtKey: ManagementStatus =
    prospect.contact_status === 'in_progress' ||
    prospect.contact_status === 'paused' ||
    prospect.contact_status === 'discarded'
      ? prospect.contact_status
      : 'pending';
  const mgmtConfig = MANAGEMENT_STYLE[mgmtKey] || MANAGEMENT_STYLE.pending;
  const mgmtLabel = MANAGEMENT_STATUS[mgmtKey] || prospect.contact_status || 'Pendiente';

  const stageKey: CommercialStage =
    prospect.commercial_stage === 'interested' ||
    prospect.commercial_stage === 'opportunity' ||
    prospect.commercial_stage === 'quote' ||
    prospect.commercial_stage === 'customer'
      ? prospect.commercial_stage
      : 'unqualified';
  const stageConfig = STAGE_STYLE[stageKey] || STAGE_STYLE.unqualified;
  const stageLabel = COMMERCIAL_STAGE[stageKey] || prospect.commercial_stage || 'Sin calificar';

  const priority = prospect.priority || 'Alta';

  const formatHistoryValue = (layer: string, value: string | null) => {
    if (!value) return '—';
    if (layer === 'management') {
      return MANAGEMENT_STATUS[value as ManagementStatus] || value;
    }
    return COMMERCIAL_STAGE[value as CommercialStage] || value;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Estado comercial</h3>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="text-[12px] text-blue-600 hover:underline font-semibold"
        >
          Editar
        </button>
      </div>

      {showEditModal && (
        <ProspectForm
          prospect={prospect}
          availableCities={[]}
          availableSectors={[]}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <div className="grid grid-cols-[100px_1fr] gap-y-3.5 items-center text-[13px]">
        {/* Gestión */}
        <span className="text-slate-500 font-medium">Gestión</span>
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${mgmtConfig.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mgmtConfig.dot}`} />
            {mgmtLabel}
          </span>
        </div>

        {/* Etapa */}
        <span className="text-slate-500 font-medium">Etapa</span>
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${stageConfig.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${stageConfig.dot}`} />
            {stageLabel}
          </span>
        </div>

        {/* Motivo de descarte (si aplica) */}
        {prospect.contact_status === 'discarded' && prospect.discard_reason && (
          <>
            <span className="text-slate-500 font-medium">Motivo descarte</span>
            <div className="text-slate-900 font-medium text-xs">
              <span className="font-semibold text-rose-700">
                {DISCARD_REASONS[prospect.discard_reason as DiscardReason] || prospect.discard_reason}
              </span>
              {prospect.discard_notes && (
                <span className="text-slate-500 ml-1">({prospect.discard_notes})</span>
              )}
            </div>
          </>
        )}

        {/* En pausa hasta (si aplica) */}
        {prospect.contact_status === 'paused' && prospect.paused_until && (
          <>
            <span className="text-slate-500 font-medium">Pausa hasta</span>
            <div className="text-slate-900 font-medium text-xs">
              <span>{format(parseISO(prospect.paused_until), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
              {prospect.discard_notes && (
                <span className="text-slate-500 ml-1">({prospect.discard_notes})</span>
              )}
            </div>
          </>
        )}

        <span className="text-slate-500 font-medium">Prioridad</span>
        <div>
          {priority === 'Alta' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">
              <X className="w-3 h-3 text-rose-500" strokeWidth={3} />
              Alta
            </span>
          ) : priority === 'Media' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">
              <Activity className="w-3 h-3 text-amber-500" strokeWidth={3} />
              Media
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              Baja
            </span>
          )}
        </div>

        <span className="text-slate-500 font-medium">Origen</span>
        <span className="text-slate-900 font-medium truncate">{prospect.source_name || 'Recomendación'}</span>

        <span className="text-slate-500 font-medium">Asignado a</span>
        <span className="text-slate-900 font-medium truncate">{prospect.assigned_to_name || 'Juan Pérez'}</span>

        <span className="text-slate-500 font-medium">Fecha de alta</span>
        <span className="text-slate-900 font-medium truncate" suppressHydrationWarning>
          {prospect.created_at ? format(parseISO(prospect.created_at), "d 'de' MMMM 'de' yyyy", { locale: es }) : '—'}
        </span>

        <span className="text-slate-500 font-medium">Última actividad</span>
        <span className="text-slate-900 font-medium truncate" suppressHydrationWarning>
          {latestActivity ? format(parseISO(latestActivity.activity_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es }) : '—'}
        </span>
      </div>

      {/* Mini-Historial de Cambios de Estado */}
      {statusHistory.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex-1">
          <div className="flex items-center gap-1.5 mb-2.5 text-slate-600 font-bold text-xs uppercase tracking-wider">
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>Últimos cambios de estado</span>
          </div>

          <div className="space-y-2">
            {statusHistory.slice(0, 5).map((h: any) => {
              const layerName = h.layer === 'management' ? 'Gestión' : 'Etapa';
              const fromVal = formatHistoryValue(h.layer, h.from_value);
              const toVal = formatHistoryValue(h.layer, h.to_value);

              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-[11px] bg-slate-50/70 p-2 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                      [{layerName}]
                    </span>
                    <span className="text-slate-500 truncate">{fromVal}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{toVal}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2" suppressHydrationWarning>
                    {h.created_at ? format(parseISO(h.created_at), 'dd/MM HH:mm') : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
