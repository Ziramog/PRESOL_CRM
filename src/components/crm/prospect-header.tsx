'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Phone, MessageCircle, PlusCircle, CalendarPlus, Target, Trash2, AlertTriangle, X, Edit, MoreHorizontal, Building2, Factory, Users } from 'lucide-react';
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
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-5 mb-6">
        
        {/* Info Block */}
        <div className="flex items-start gap-4">
          <div className="w-[52px] h-[52px] rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-bold text-slate-900 leading-none">
                {prospect.company_name}
              </h1>
              
              {/* Status Badge */}
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                {PROSPECT_STATUS[prospect.contact_status as keyof typeof PROSPECT_STATUS] || 'Prospecto'}
              </span>
              
              {/* Priority Badge */}
              {prospect.priority === 'Alta' && (
                <span className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                  Alta prioridad
                </span>
              )}
            </div>
            
            <p className="text-[13px] font-medium text-slate-500 mt-1.5">
              Prospecto comercial
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[12px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {prospect.city || 'Ubicación no registrada'}
              </div>
              {prospect.commercial_category && (
                <div className="flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5 text-slate-400" />
                  {prospect.commercial_category}
                </div>
              )}
              {prospect.employee_count && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {prospect.employee_count} empleados
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {cleanPhone && (
            <>
              <a 
                href={`tel:${cleanPhone}`}
                className="h-[36px] flex items-center justify-center gap-2 px-4 bg-white border border-blue-200 rounded-lg text-[13px] font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
                Llamar
              </a>
              <a 
                href={`whatsapp://send?phone=${cleanPhone.replace('+', '')}`}
                className="h-[36px] flex items-center justify-center gap-2 px-4 bg-emerald-50 border border-emerald-200 rounded-lg text-[13px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </>
          )}
          
          <button 
            onClick={openMaps}
            className="h-[36px] flex items-center justify-center gap-2 px-4 bg-white border border-blue-200 rounded-lg text-[13px] font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            Maps
          </button>
          
          <button 
            onClick={() => setShowActivityForm(true)}
            className="h-[36px] hidden md:flex items-center justify-center gap-2 px-4 bg-blue-600 text-white rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar gestión
          </button>

          {/* Context Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="h-[36px] w-[36px] flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 flex flex-col">
                  <button 
                    onClick={() => { setShowTaskForm(true); setShowMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-slate-400" /> Crear tarea
                  </button>
                  <button 
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <Target className="w-3.5 h-3.5 text-slate-400" /> Crear oportunidad
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button 
                    onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-400" /> Editar prospecto
                  </button>
                  <button 
                    onClick={() => { setShowDeleteModal(true); setShowMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-rose-600 hover:bg-rose-50 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Eliminar prospecto
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FIXED MOBILE CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)]">
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
