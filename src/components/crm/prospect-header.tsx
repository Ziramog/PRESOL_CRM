'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, MessageCircle, PlusCircle, Trash2, AlertTriangle, X, Edit, Building2, Factory, Mic, ChevronLeft, MoreHorizontal, ChevronRight, Star, FileText } from 'lucide-react';
import { ActivityForm } from './activity-form';
import { TaskForm } from './task-form';
import { OpportunityForm } from './opportunity-form';
import { ProspectForm } from './prospect-form';
import { VoiceRecorderModal } from './v2/VoiceRecorderModal';
import { updateProspectStatus, deleteProspect, toggleFavorite } from '@/app/actions/prospects';

import { PROSPECT_STATUS } from '@/lib/constants';

const STATUS_OPTIONS = Object.entries(PROSPECT_STATUS).map(([value, label]) => ({ value, label }));

export function ProspectHeader({ 
  prospect, 
  availableCities = [], 
  availableSectors = [] 
}: { 
  prospect: any, 
  availableCities?: string[], 
  availableSectors?: string[] 
}) {
  const router = useRouter();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

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
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => router.push('/prospects')}
          className="flex items-center gap-2 text-[17px] font-medium text-slate-900"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          Prospecto
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-700 bg-white shadow-sm hover:bg-slate-50 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col mb-4 bg-white rounded-[24px] p-4 shadow-sm border border-slate-100">
        {/* 2. Title Section */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-[56px] h-[56px] rounded-[14px] bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7 text-blue-600" strokeWidth={1.5} />
          </div>
          
          <div className="flex flex-col pt-0.5">
            <h1 className="text-[18px] sm:text-[20px] font-bold text-slate-900 leading-tight mb-1">
              {prospect.company_name}
            </h1>
            
            {/* Status Dropdown */}
            <div className="relative inline-flex items-center w-max mb-1">
              <select
                value={prospect.contact_status || 'pending'}
                onChange={handleStatusChange}
                disabled={isPending}
                className={`appearance-none cursor-pointer outline-none transition-colors border pl-7 pr-7 py-1 rounded-full text-[12px] font-medium
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
              <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
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
            
            <p className="text-[13px] text-slate-500">
              Prospecto comercial
            </p>
          </div>
        </div>

        {/* 3. Info List */}
        <div className="flex flex-col gap-0 border-t border-slate-100 pt-1.5 mb-4">
          <div className="flex items-center justify-between py-2.5 cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                <MapPin className="w-4 h-4 text-slate-700" strokeWidth={2} />
              </div>
              <span className="text-[14px] sm:text-[15px] text-slate-900">{prospect.city || 'Sin ciudad'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
          
          <div className="w-full h-px bg-slate-100 ml-11"></div>
          
          <div className="flex items-center justify-between py-2.5 cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                <Factory className="w-4 h-4 text-slate-700" strokeWidth={2} />
              </div>
              <span className="text-[14px] sm:text-[15px] text-slate-900">{prospect.sector || prospect.commercial_category || 'Sin rubro'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* 4. Primary Action Button */}
        <button 
          onClick={() => setShowActivityForm(true)}
          className="w-full h-[56px] bg-[#1456c2] text-white rounded-[20px] flex items-center justify-between px-6 shadow-md hover:bg-blue-800 transition-all active:scale-[0.98] mb-6"
        >
          <div className="flex items-center gap-3">
            <PlusCircle className="w-7 h-7" strokeWidth={2} />
            <span className="text-[17px] font-semibold tracking-wide">Registrar actividad</span>
          </div>
          <ChevronRight className="w-5 h-5 opacity-70" />
        </button>

        {/* 5. Grid Actions */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          
          {/* Llamar */}
          {cleanPhone ? (
            <a href={`tel:${cleanPhone}`} className="bg-white rounded-[14px] p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer h-[100px] sm:h-[110px]">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1.5 shrink-0">
                <Phone className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight">Llamar</span>
              <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate w-full px-1">{cleanPhone}</span>
            </a>
          ) : (
            <button onClick={() => setShowEditModal(true)} className="bg-white rounded-[14px] p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer h-[100px] sm:h-[110px]">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-1.5 shrink-0">
                <Phone className="w-5 h-5 text-slate-400" strokeWidth={2} />
              </div>
              <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight">Llamar</span>
              <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate w-full px-1">+ Teléfono</span>
            </button>
          )}

          {/* Nota de Voz */}
          <button onClick={() => setShowVoiceModal(true)} className="bg-white rounded-[14px] p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer h-[100px] sm:h-[110px]">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1.5 shrink-0">
              <Mic className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight">Nota voz</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate w-full px-1">Audio</span>
          </button>

          {/* Ubicación */}
          <button onClick={openMaps} className="bg-white rounded-[14px] p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer h-[100px] sm:h-[110px]">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1.5 shrink-0">
              <MapPin className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight">Ubicación</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate w-full px-1">{prospect.city || 'Mapa'}</span>
          </button>

          {/* Favorito */}
          <button onClick={handleToggleFavorite} className="bg-white rounded-[14px] p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer h-[100px] sm:h-[110px]">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 shrink-0 ${optimisticFav ? 'bg-blue-600' : 'bg-blue-50'}`}>
              <Star className={`w-5 h-5 ${optimisticFav ? 'text-white fill-white' : 'text-blue-600'}`} strokeWidth={2} />
            </div>
            <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight">{optimisticFav ? 'Favorito' : 'Favorito'}</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate w-full px-1">{optimisticFav ? 'Quitar' : 'Agregar'}</span>
          </button>

          {/* Editar */}
          <button onClick={() => setShowEditModal(true)} className="bg-white rounded-[14px] p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer h-[100px] sm:h-[110px]">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1.5 shrink-0">
              <Edit className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight">Editar</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate w-full px-1">Datos</span>
          </button>

          {/* Eliminar */}
          <button onClick={() => setShowDeleteModal(true)} className="bg-white rounded-[14px] p-2 sm:p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer h-[100px] sm:h-[110px]">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-1.5 shrink-0">
              <Trash2 className="w-5 h-5 text-rose-500" strokeWidth={2} />
            </div>
            <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight">Eliminar</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate w-full px-1">Prospecto</span>
          </button>

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
