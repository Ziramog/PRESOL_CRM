'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface InternalNotesAccordionProps {
  comments: any[];
}

export function InternalNotesAccordion({ comments }: InternalNotesAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-auto">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h3 className="text-[13px] font-bold text-gray-900">Notas internas ({comments?.length || 0})</h3>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3 space-y-3">
            {!comments || comments.length === 0 ? (
              <p className="text-[12px] text-gray-500 text-center py-2">No hay notas internas.</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="bg-yellow-50/60 p-3 rounded-lg border border-yellow-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gray-900">{comment.user_full_name || 'Usuario'}</span>
                    <span className="text-[10px] text-gray-500">{format(parseISO(comment.created_at), 'dd MMM, HH:mm', { locale: es })}</span>
                  </div>
                  <p className="text-[12px] text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.body}</p>
                </div>
              ))
            )}
            
            <div className="mt-2 pt-3 border-t border-gray-100">
              <button className="text-[11px] text-blue-600 hover:underline font-medium">+ Agregar nota</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
