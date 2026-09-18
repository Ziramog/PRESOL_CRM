'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, MessageCircle, PlusCircle, Trash2, AlertTriangle, X, Edit, Building2, Factory, Mic, ChevronLeft, MoreHorizontal, ChevronRight, Heart, Calendar, Clock, User, ArrowUpRight } from 'lucide-react';
import { ActivityForm } from './activity-form';
import { TaskForm } from './task-form';
import { OpportunityForm } from './opportunity-form';
import { ProspectForm } from './prospect-form';
import { VoiceRecorderModal } from './v2/VoiceRecorderModal';
import { updateProspectStatus, deleteProspect, toggleFavorite } from '@/app/actions/prospects';

import { PROSPECT_STATUS } from '@/lib/constants';

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

      <div className="relative flex flex-col mb-4 bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
        
        {/* Top Right Actions (Heart & Menu) */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
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

        {/* 2. Title Section */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 mb-5 mt-2">
          <div className="w-[64px] h-[64px] rounded-[16px] bg-blue-50 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
            <Building2 className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
          </div>
          
          <div className="flex flex-col mt-1 w-full px-4 sm:px-0">
            <h1 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">
              {prospect.company_name}
            </h1>
            <p className="text-[14px] text-slate-500 mb-3">
              Prospecto comercial
            </p>
            
            {/* Status & Priority Row */}
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
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
        <div className="flex items-center justify-center sm:justify-start gap-3 text-[13px] text-slate-600 mb-6 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="truncate max-w-[120px]">{prospect.city || 'Sin ciudad'}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <Factory className="w-4 h-4 text-slate-400" />
            <span className="truncate max-w-[120px]">{prospect.sector || prospect.commercial_category || 'Sin rubro'}</span>
          </div>
        </div>

        {/* 4. Primary Action Button */}
        <button 
          onClick={() => setShowActivityForm(true)}
          className="w-full h-[54px] bg-[#1456c2] text-white rounded-2xl flex items-center justify-center gap-2.5 shadow-md hover:bg-blue-800 transition-all active:scale-[0.98] mb-5"
        >
          <PlusCircle className="w-6 h-6" strokeWidth={2} />
          <span className="text-[16px] font-semibold tracking-wide">Registrar actividad</span>
        </button>

        {/* 5. Compact Quick Actions (4 items, 1 row) */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {/* Llamar */}
          {cleanPhone ? (
            <a href={`tel:${cleanPhone}`} className="flex flex-col items-center flex-1 gap-1.5 group cursor-pointer active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                <Phone className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Llamar</span>
            </a>
          ) : (
            <button onClick={() => setShowEditModal(true)} className="flex flex-col items-center flex-1 gap-1.5 group cursor-pointer active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                <Phone className="w-5 h-5 text-slate-400" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Llamar</span>
            </button>
          )}

          {/* Nota de Voz */}
          <button onClick={() => setShowVoiceModal(true)} className="flex flex-col items-center flex-1 gap-1.5 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <Mic className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Audio</span>
          </button>

          {/* WhatsApp */}
          {cleanPhone ? (
            <a href={`whatsapp://send?phone=${cleanPhone}`} className="flex flex-col items-center flex-1 gap-1.5 group cursor-pointer active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                <MessageCircle className="w-5 h-5 text-[#25D366]" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">WhatsApp</span>
            </a>
          ) : (
            <button onClick={() => setShowEditModal(true)} className="flex flex-col items-center flex-1 gap-1.5 group cursor-pointer active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                <MessageCircle className="w-5 h-5 text-slate-400" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">WhatsApp</span>
            </button>
          )}

          {/* Ubicación */}
          <button onClick={openMaps} className="flex flex-col items-center flex-1 gap-1.5 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <MapPin className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Mapa</span>
          </button>
        </div>

        {/* 6. Context Rows (Executive Feature) */}
        <div className="flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
          
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
            <div className="flex-1 min-w-0 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Próxima acción</p>
                <p className="text-[14px] font-bold text-slate-900 truncate">
                  {nextTask ? nextTask.title : 'Sin tareas pendientes'}
                </p>
              </div>
              {nextTask && (
                <span className="text-[12px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg shrink-0">
                  {formatFutureDate(nextTask.due_at)}
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
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
