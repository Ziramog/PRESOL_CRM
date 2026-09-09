'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Usamos el cliente estándar solo para suscripciones (solo lectura / notificaciones)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function RealtimeListener({ prospectId }: { prospectId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    // Suscribirse a cambios en 'activities' para este prospecto
    const activitiesSub = supabase
      .channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `prospect_id=eq.${prospectId}`,
        },
        () => {
          // Cuando otro usuario inserta una actividad, refrescamos la página
          router.refresh();
        }
      )
      .subscribe();

    // Suscribirse a cambios en 'comments' para este prospecto
    const commentsSub = supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `prospect_id=eq.${prospectId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      activitiesSub.unsubscribe();
      commentsSub.unsubscribe();
    };
  }, [prospectId, router]);

  return null; // Componente invisible
}
