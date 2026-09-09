'use client';

import { useState } from 'react';
import { createComment } from '@/app/actions/comments';
import { MessageSquare, Send } from 'lucide-react';

export function DirectionCommentForm({ prospectId }: { prospectId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await createComment(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      (e.target as HTMLFormElement).reset();
      setIsPending(false);
    }
  };

  return (
    <div className="bg-purple-50 rounded-lg border border-purple-100 p-4 shadow-sm mt-6">
      <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-1.5">
        <MessageSquare className="w-4 h-4" />
        Nota de Dirección
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="prospect_id" value={prospectId} />
        <input type="hidden" name="is_direction_note" value="true" />
        
        <textarea 
          name="body"
          required
          placeholder="Escribe una observación, instrucción o comentario..."
          className="w-full text-sm rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 resize-none"
          rows={3}
        />
        
        <div className="flex justify-end items-center gap-3">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button 
            type="submit" 
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Enviando...' : (
              <>
                <Send className="w-3.5 h-3.5" />
                Guardar Nota
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
