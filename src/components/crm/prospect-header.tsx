'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, MessageCircle, PlusCircle, Trash2, AlertTriangle, X, Edit, Building2, Factory, Mic, ChevronLeft, MoreHorizontal, ChevronRight, Heart, Calendar, Clock, User, ArrowUpRight } from 'lucide-react';
import { ActivityForm } from './activity-form';
import { TaskForm } from './task-form';
import { OpportunityForm } from './opportunity-form';
import { ProspectForm } from '@/components/crm/prospect-form';
import { VoiceRecorderModal } from './v2/VoiceRecorderModal';
import { updateProspectStatus, deleteProspect, toggleFavorite } from '@/app/actions/prospects';
import { getLeadTemperature, PulseIndicator } from '@/lib/lead-temperature';

import { PROSPECT_STATUS } from '@/lib/constants';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const STATUS_OPTIONS = Object.entries(PROSPECT_STATUS).map(([value, label]) => ({ value, label }));

function formatDateDistance(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
  
  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(d);
}

function formatFutureDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

export function ProspectHeader({ 
  prospect, 
  availableCities = [], 
  availableSectors = [],
  latestActivity,
  nextTask
}: { 
  prospect: any, 
  availableCities?: string[], 
  availableSectors?: string[],
  latestActivity?: any,
  nextTask?: any
}) {
  const router = useRouter();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'voice') {
        setShowVoiceModal(true);
        window.history.replaceState(null, '', `/prospects/${prospect.id}`);
      }
    }
  }, [prospect.id]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticFav, setOptimisticFav] = useState(prospect.is_favorite ?? false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteProspect(prospect.id);
    if (res.error) {
      setDeleteError(res.error);
      setIsDeleting(false);
    } else {
      router.push('/prospects');
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(() => {
      updateProspectStatus(prospect.id, newStatus);
    });
  };

  const handleToggleFavorite = () => {
    const prev = optimisticFav;
    setOptimisticFav(!prev);
    startTransition(async () => {
      const res = await toggleFavorite(prospect.id, prev);
      if (res?.error) {
        setOptimisticFav(prev);
      }
    });
  };

  const openMaps = () => {
    if (prospect.google_maps_url) {
      window.open(prospect.google_maps_url, '_blank');
    } else {
      const query = encodeURIComponent(`${prospect.company_name} ${prospect.city || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const primaryContact = prospect.contacts?.find((c: any) => c.is_primary) || prospect.contacts?.[0];
  const activePhone = prospect.primary_phone || primaryContact?.phone;
  const cleanPhone = activePhone?.replace(/[^\d+]/g, '');

  return (
    <>
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button 
          onClick={() => router.push('/prospects')}
          className="flex items-center gap-2 text-[17px] font-medium text-slate-900 active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          Prospecto
        </button>
      </div>

      <div className="relative flex flex-col lg:flex-row lg:flex-wrap lg:justify-between lg:items-start mb-4 bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 lg:gap-y-6">
        
        {/* Top Right Actions (Heart & Menu) */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <button 
            onClick={handleToggleFavorite}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-90 ${optimisticFav ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <Heart className={`w-5 h-5 ${optimisticFav ? 'fill-rose-500' : ''}`} strokeWidth={optimisticFav ? 0 : 2} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors active:scale-90"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Edit className="w-4 h-4 text-slate-400" />
                    Editar prospecto
                  </button>
                  <div className="w-full h-px bg-slate-100 my-1"></div>
                  <button 
                    onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    Eliminar prospecto
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* --- LEFT SECTION (Identity & Info) --- */}
        <div className="flex flex-col flex-1 min-w-0 lg:pr-4">
          {/* 2. Title Section */}
          <div className="flex flex-row items-center sm:items-start text-left gap-3 mb-5 mt-2 lg:mb-3 px-1">
            <div className="w-[64px] h-[64px] rounded-[16px] bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
            </div>
            
            <div className="flex flex-col mt-0.5 w-full">
              <div className="flex items-center gap-2 pr-20 lg:pr-0">
                <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 leading-tight mb-1">
                  {prospect.company_name}
                </h1>
                <PulseIndicator temp={getLeadTemperature(prospect.last_manual_activity_at)} />
              </div>
              <p className="text-[13px] sm:text-[14px] text-slate-500 mb-2.5">
                Prospecto comercial
              </p>
              
              {/* Status & Priority Row */}
              <div className="flex items-center justify-start gap-2 flex-wrap">
                {/* Status Dropdown */}
                <div className="relative inline-flex items-center">
                  <select
                    value={prospect.contact_status || 'pending'}
                    onChange={handleStatusChange}
                    disabled={isPending}
                    className={`appearance-none cursor-pointer outline-none transition-colors border pl-8 pr-7 py-1.5 rounded-full text-[12px] font-bold tracking-wide
                      ${isPending ? 'opacity-50' : ''}
                      ${prospect.contact_status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        prospect.contact_status === 'interested' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        prospect.contact_status === 'opportunity' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        prospect.contact_status === 'quote' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        prospect.contact_status === 'customer' ? 'bg-green-50 text-green-800 border-green-200' :
                        prospect.contact_status === 'discarded' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }
                    `}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <span className={`w-2 h-2 rounded-full 
                      ${prospect.contact_status === 'in_progress' ? 'bg-blue-500' :
                        prospect.contact_status === 'interested' ? 'bg-emerald-500' :
                        prospect.contact_status === 'opportunity' ? 'bg-indigo-500' :
                        prospect.contact_status === 'quote' ? 'bg-purple-500' :
                        prospect.contact_status === 'customer' ? 'bg-green-500' :
                        prospect.contact_status === 'discarded' ? 'bg-rose-500' :
                        'bg-amber-500'
                      }
                    `}></span>
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-current opacity-60">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                    </svg>
                  </div>
                </div>

                {/* Priority */}
                {prospect.priority === 'Alta' && (
                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-[12px] font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={3} />
                    Alta prioridad
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Compact Info Row (Location | Sector) */}
          <div className="flex items-center justify-start gap-3 text-[13px] text-slate-600 mb-6 lg:mb-0 font-medium px-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate max-w-[120px] lg:max-w-none">{prospect.city || 'Sin ciudad'}</span>
            </div>
            <span className="text-slate-300 shrink-0">|</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <Factory className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate max-w-[120px] lg:max-w-none">{prospect.sector || prospect.commercial_category || 'Sin rubro'}</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT SECTION (Actions) --- */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 w-full lg:w-auto shrink-0 mt-2 lg:mt-6 lg:pr-12">
          {/* 4. Primary Action Button */}
          <button 
            onClick={() => setShowActivityForm(true)}
            className="w-full lg:w-auto lg:px-5 h-[54px] lg:h-[48px] bg-[#1456c2] text-white rounded-2xl flex items-center justify-center gap-2.5 shadow-md hover:bg-blue-800 transition-all active:scale-[0.98] mb-5 lg:mb-0"
          >
            <PlusCircle className="w-6 h-6 lg:w-5 lg:h-5" strokeWidth={2} />
            <span className="text-[16px] lg:text-[14px] font-semibold tracking-wide whitespace-nowrap">Registrar actividad</span>
          </button>

          {/* 5. Compact Quick Actions (4 items, 1 row) */}
          <div className="flex items-center justify-between lg:justify-end gap-3 lg:gap-2.5 mb-6 lg:mb-0 px-1 lg:px-0">
            {/* Llamar */}
            {cleanPhone ? (
              <a href={`tel:${cleanPhone}`} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors active:scale-95">
                <Phone className="w-6 h-6 lg:w-5 lg:h-5 text-blue-600" strokeWidth={2.5} />
              </a>
            ) : (
              <button onClick={() => setShowEditModal(true)} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95 opacity-50">
                <Phone className="w-6 h-6 lg:w-5 lg:h-5 text-slate-400" strokeWidth={2.5} />
              </button>
            )}

            {/* Nota de Voz */}
            <button onClick={() => setShowVoiceModal(true)} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-colors active:scale-95">
              <Mic className="w-6 h-6 lg:w-5 lg:h-5 text-purple-600" strokeWidth={2.5} />
            </button>

            {/* WhatsApp */}
            {cleanPhone ? (
              <a href={`whatsapp://send?phone=${cleanPhone}`} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-[#25D366]/10 hover:border-[#25D366]/30 transition-colors active:scale-95">
                <WhatsAppIcon className="w-7 h-7 lg:w-6 lg:h-6 text-[#25D366]" />
              </a>
            ) : (
              <button onClick={() => setShowEditModal(true)} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95 opacity-50">
                <WhatsAppIcon className="w-7 h-7 lg:w-6 lg:h-6 text-slate-400" />
              </button>
            )}

            {/* Ubicación */}
            <button onClick={openMaps} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95">
              <MapPin className="w-6 h-6 lg:w-5 lg:h-5 text-blue-600" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* --- BOTTOM SECTION (Context Rows) --- */}
        <div className="w-full mt-2 lg:mt-3">
          {/* 6. Context Rows */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            
            {/* Last Activity */}
            <div className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Última actividad</p>
                <p className="text-[14px] font-bold text-slate-900 truncate">
                  {latestActivity ? latestActivity.type : 'Sin actividad reciente'}
                </p>
                {latestActivity && (
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {formatDateDistance(latestActivity.activity_at)} · {latestActivity.profiles?.full_name || 'Usuario'}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>

            {/* Next Task */}
            <div className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0 flex justify-between items-center pr-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Próxima acción</p>
                  <p className="text-[14px] font-bold text-slate-900 truncate pr-2">
                    {nextTask ? nextTask.title : 'Sin tareas pendientes'}
                  </p>
                </div>
                {nextTask && (
                  <span className="text-[12px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg shrink-0">
                    {formatFutureDate(nextTask.due_at)}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>

          </div>
        </div>

      </div>
      
      {showEditModal && (
        <ProspectForm 
          prospect={prospect}
          availableCities={availableCities}
          availableSectors={availableSectors}
          onClose={() => setShowEditModal(false)} 
        />
      )}
      
      {showVoiceModal && (
        <VoiceRecorderModal 
          prospectId={prospect.id} 
          onClose={() => setShowVoiceModal(false)} 
        />
      )}

      {showActivityForm && (
        <ActivityForm 
          prospectId={prospect.id} 
          onClose={() => setShowActivityForm(false)} 
        />
      )}
      
      {showTaskForm && (
        <TaskForm 
          prospectId={prospect.id} 
          onClose={() => setShowTaskForm(false)} 
        />
      )}

      {showOpportunityForm && (
        <OpportunityForm 
          prospectId={prospect.id} 
          onClose={() => setShowOpportunityForm(false)} 
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-sm w-full max-w-md shadow-2xl p-6 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-sm bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-light tracking-tight text-gray-900">
                  ¿Eliminar prospecto?
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {prospect.company_name}
                </p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  Esta acción no se puede deshacer. Se eliminarán permanentemente el prospecto y todas sus interacciones, tareas y contactos vinculados.
                </p>
                {deleteError && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-sm mt-3 font-medium">
                    {deleteError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors border border-gray-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-sm transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
