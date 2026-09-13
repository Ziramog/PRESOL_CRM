'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function RealtimeListener({ prospectId }: { prospectId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    
    const channel = supabase.channel(`prospect_${prospectId}_changes`);

    const tablesToWatch = ['activities', 'comments', 'tasks', 'opportunities', 'contacts', 'prospects'];

    tablesToWatch.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: table === 'prospects' ? `id=eq.${prospectId}` : `prospect_id=eq.${prospectId}`,
        },
        () => {
          router.refresh();
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [prospectId, router]);

  return null;
}
