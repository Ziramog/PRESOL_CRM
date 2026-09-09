'use client';

import { useState, useTransition } from 'react';
import { MapPin, Navigation, Phone, MessageCircle, PlusCircle, CalendarPlus, Target } from 'lucide-react';
import { ActivityForm } from './activity-form';
import { TaskForm } from './task-form';
import { updateProspectStatus } from '@/app/actions/prospects';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'attempted', label: 'Intentado' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'visited', label: 'Visitado' },
  { value: 'follow_up', label: 'En Seguimiento' },
  { value: 'opportunity', label: 'Con Oportunidad' },
  { value: 'customer', label: 'Cliente Activo' },
  { value: 'not_interested', label: 'No Interesado' },
  { value: 'discarded', label: 'Descartado' },
  { value: 'wrong_contact', label: 'Dato Erróneo' }
];

export function ProspectHeader({ prospect }: { prospect: any }) {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isPending, startTransition] = useTransition();

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
                    ${prospect.contact_status === 'visited' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      prospect.contact_status === 'customer' ? 'bg-green-50 text-green-700 border-green-200' :
                      prospect.contact_status === 'contacted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      prospect.contact_status === 'discarded' ? 'bg-red-50 text-red-700 border-red-200' :
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
                  href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                  target="_blank"
                  rel="noreferrer"
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
        <div className="flex overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 gap-2 mt-6 border-t border-gray-100 pt-5 scrollbar-hide">
          <button 
            onClick={() => setShowActivityForm(true)}
            className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar actividad
          </button>
          <button 
            onClick={() => setShowTaskForm(true)}
            className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <CalendarPlus className="w-4 h-4 text-gray-500" />
            Crear tarea
          </button>
          <button className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
            <Target className="w-4 h-4 text-gray-500" />
            Crear oportunidad
          </button>
        </div>
      </div>
      
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
    </>
  );
}
