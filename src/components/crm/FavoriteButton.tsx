'use client';

import { useState, useTransition, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toggleFavorite } from '@/app/actions/prospects';

interface FavoriteButtonProps {
  prospectId: string;
  isFavorite: boolean;
  /** 'card' = small, inline heart in card action bar | 'header' = larger, in detail header */
  variant?: 'card' | 'header';
}

export function FavoriteButton({ prospectId, isFavorite, variant = 'card' }: FavoriteButtonProps) {
  const [optimistic, setOptimistic] = useState(isFavorite);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOptimistic(isFavorite);
  }, [isFavorite]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = optimistic;
    const next = !prev;
    setOptimistic(next); // instant feedback
    startTransition(async () => {
      const res = await toggleFavorite(prospectId, prev);
      if (res?.error) {
        setOptimistic(prev); // rollback on error
      }
    });
  };

  if (variant === 'header') {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        title={optimistic ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        className={[
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold transition-all',
          optimistic
            ? 'bg-rose-50 text-rose-600 border border-rose-200'
            : 'bg-white text-gray-400 border border-gray-200 hover:bg-rose-50 hover:text-rose-500',
        ].join(' ')}
      >
        <Heart
          className="w-4 h-4"
          fill={optimistic ? 'currentColor' : 'none'}
          strokeWidth={2}
        />
        <span>{optimistic ? 'Favorito' : 'Favorito'}</span>
      </button>
    );
  }

  // Card variant — compact circular icon button
  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={optimistic ? 'Quitar de favoritos' : 'Marcar favorito'}
      className={[
        'w-8 h-8 shrink-0 flex items-center justify-center rounded-full border shadow-sm transition-all active:scale-95',
        optimistic
          ? 'bg-rose-50 text-rose-500 border-rose-200'
          : 'bg-white text-slate-300 border-slate-200 hover:bg-rose-50 hover:text-rose-400 hover:border-rose-200',
      ].join(' ')}
    >
      <Heart
        className="w-4 h-4"
        fill={optimistic ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
    </button>
  );
}
