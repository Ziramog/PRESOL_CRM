'use client';

import { useState } from 'react';
import { MapPin, Navigation, Phone, MessageCircle, PlusCircle, CalendarPlus, Target } from 'lucide-react';
import { ActivityForm } from './activity-form';
import { TaskForm } from './task-form';

export function ProspectHeader({ prospect }: { prospect: any }) {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

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
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                {prospect.contact_status}
              </span>
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
