'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Phone, MessageCircle, PlusCircle, CalendarPlus, Target, Trash2, AlertTriangle, X, Edit, MoreHorizontal } from 'lucide-react';
import { ActivityForm } from './activity-form';
import { TaskForm } from './task-form';
import { ProspectForm } from './prospect-form';
import { updateProspectStatus, deleteProspect } from '@/app/actions/prospects';

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
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const openMaps = () => {
    if (prospect.google_maps_url) {
      window.open(prospect.google_maps_url, '_blank');
    } else {
      const query = encodeURIComponent(`${prospect.company_name} ${prospect.city || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const cleanPhone = prospect.primary_phone?.replace(/[^\d+]/g, '');

  return (
    <>
      <div className="bg-white rounded-[10px] border border-[#e6eaf0] p-4 md:px-5 md:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] mb-3">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 leading-[1.2] mb-1">
              {prospect.company_name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-500 mb-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {prospect.city || 'Ciudad no registrada'}
              </div>
              {prospect.commercial_category && (
                <div className="flex items-center gap-1.5 before:content-['•'] before:text-gray-300 before:mr-1.5">
                  {prospect.commercial_category}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="h-[22px] px-2 flex items-center text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-100 rounded-full">
                {prospect.external_id}
              </span>
              {prospect.class && (
                <span className={`h-[22px] px-2 flex items-center text-[11px] font-semibold rounded-full
                  ${prospect.class === 'A' ? 'bg-green-50 text-green-700 border border-green-100' : 
                    prospect.class === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                    'bg-gray-50 text-gray-700 border border-gray-100'}`
                }>
                  Clase {prospect.class}
                </span>
              )}
              <div className="relative">
                <select
                  value={prospect.contact_status || 'pending'}
                  onChange={handleStatusChange}
                  disabled={isPending}
                  className={`h-[22px] text-[11px] px-2 pl-2 pr-6 rounded-full font-semibold appearance-none cursor-pointer border transition-colors outline-none
                    ${isPending ? 'opacity-50' : ''}
                    ${prospect.contact_status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      prospect.contact_status === 'interested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      prospect.contact_status === 'opportunity' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      prospect.contact_status === 'quote' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      prospect.contact_status === 'customer' ? 'bg-green-50 text-green-700 border-green-200' :
                      prospect.contact_status === 'discarded' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }
                  `}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-current opacity-70">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0 relative">
            {cleanPhone && (
              <a 
                href={`tel:${cleanPhone}`}
                className="h-[34px] flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 bg-white border border-gray-200 rounded-md text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-green-600" />
                Llamar
              </a>
            )}
            {cleanPhone && (
              <a 
                href={`whatsapp://send?phone=${cleanPhone.replace('+', '')}`}
                className="h-[34px] flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 bg-white border border-gray-200 rounded-md text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                WhatsApp
              </a>
            )}
            <button 
              onClick={openMaps}
              className="h-[34px] flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 bg-white border border-gray-200 rounded-md text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              Maps
            </button>
            <button 
              onClick={() => setShowActivityForm(true)}
              className="h-[34px] hidden md:flex flex-1 md:flex-none items-center justify-center gap-1.5 px-3 bg-blue-600 text-white rounded-md text-[12px] font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Registrar gestión
            </button>

            {/* Context Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="h-[34px] w-[34px] flex items-center justify-center bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 flex flex-col">
                    <button 
                      onClick={() => { setShowTaskForm(true); setShowMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-gray-400" /> Crear tarea
                    </button>
                    <button 
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <Target className="w-3.5 h-3.5 text-gray-400" /> Crear oportunidad
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button 
                      onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <Edit className="w-3.5 h-3.5 text-gray-400" /> Editar prospecto
                    </button>
                    <button 
                      onClick={() => { setShowDeleteModal(true); setShowMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" /> Eliminar prospecto
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FIXED MOBILE CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)]">
        <button 
          onClick={() => setShowActivityForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 text-white rounded-lg text-base font-bold shadow-md active:scale-95 transition-transform"
        >
          <PlusCircle className="w-5 h-5" />
          Registrar gestión
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
                    Sí, eliminar
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
