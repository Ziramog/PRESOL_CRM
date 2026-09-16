'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, Loader2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { createComment } from '@/app/actions/comments';
import { useRouter } from 'next/navigation';

interface InternalNotesAccordionProps {
  comments: any[];
  prospectId: string;
}

export function InternalNotesAccordion({ comments, prospectId }: InternalNotesAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('prospect_id', prospectId);
    formData.append('body', newNote);
    formData.append('is_direction_note', 'false'); // Internal notes for standard users

    const result = await createComment(formData);
    
    if (result.success) {
      setNewNote('');
      setIsAdding(false);
      router.refresh();
    } else {
      alert('Error al agregar nota: ' + result.error);
    }
    setIsSubmitting(false);
  };

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
                    <span className="text-[10px] text-gray-500" suppressHydrationWarning>{format(parseISO(comment.created_at), 'dd MMM, HH:mm', { locale: es })}</span>
                  </div>
                  <p className="text-[12px] text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.body}</p>
                </div>
              ))
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
              {!isAdding ? (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[12px] font-bold transition-colors w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar nota
                </button>
              ) : (
                <div className="space-y-2 mt-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Escribí una nota interna..."
                    className="w-full text-[12px] p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => { setIsAdding(false); setNewNote(''); }}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddNote}
                      disabled={isSubmitting || !newNote.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-gray-900 text-white hover:bg-gray-800 rounded-md disabled:opacity-50"
                    >
                      {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
