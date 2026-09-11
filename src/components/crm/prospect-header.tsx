'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Phone, MessageCircle, PlusCircle, CalendarPlus, Target, Trash2, AlertTriangle, X, Edit } from 'lucide-react';
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
      <div className="bg-white rounded-lg border border-gray-200 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {prospect.external_id}
              </span>
              {prospect.class && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium
                  ${prospect.class === 'A' ? 'bg-green-100 text-green-800' : 
                    prospect.class === 'B' ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'}`
                }>
                  Clase {prospect.class}
                </span>
              )}
              <div className="relative">
                <select
                  value={prospect.contact_status || 'pending'}
                  onChange={handleStatusChange}
                  disabled={isPending}
                  className={`text-xs px-2 py-0.5 pl-2 pr-6 rounded font-medium appearance-none cursor-pointer border transition-colors outline-none
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-current opacity-70">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {prospect.company_name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                {prospect.city || 'Ciudad no registrada'}
              </div>
              {prospect.commercial_category && (
                <div className="flex items-center gap-1.5 before:content-['•'] before:text-gray-300 before:mr-2">
                  {prospect.commercial_category}
                </div>
              )}
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={openMaps}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              Navegar
            </button>
            
            {cleanPhone && (
              <>
                <a 
                  href={`tel:${cleanPhone}`}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Phone className="w-4 h-4 text-green-600" />
                  Llamar
                </a>
                <a 
                  href={`whatsapp://send?phone=${cleanPhone.replace('+', '')}`}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
        
        {/* Acciones de gestión */}
        <div className="flex flex-wrap items-center gap-2 mt-6 border-t border-gray-100 pt-5">
          <button 
            onClick={() => setShowActivityForm(true)}
            className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sm text-xs font-semibold tracking-wider uppercase hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar actividad
          </button>
          <button 
            onClick={() => setShowTaskForm(true)}
            className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-sm text-xs font-semibold tracking-wider uppercase hover:bg-gray-50 transition-colors"
          >
            <CalendarPlus className="w-4 h-4 text-gray-500" />
            Crear tarea
          </button>
          <button className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-sm text-xs font-semibold tracking-wider uppercase hover:bg-gray-50 transition-colors">
            <Target className="w-4 h-4 text-gray-500" />
            Crear oportunidad
          </button>
          
          <button 
            onClick={() => setShowEditModal(true)}
            className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-sm text-xs font-semibold tracking-wider uppercase hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 text-gray-500" />
            Editar
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            title="Eliminar prospecto permanentemente"
            className="whitespace-nowrap flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200 rounded-sm text-xs font-semibold tracking-wider uppercase transition-colors ml-auto shadow-sm active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Borrar
          </button>
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
