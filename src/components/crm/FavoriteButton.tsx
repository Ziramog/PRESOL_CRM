'use client';

import { useState, useTransition, useEffect } from 'react';
import { Star } from 'lucide-react';
import { toggleFavorite } from '@/app/actions/prospects';

interface FavoriteButtonProps {
  prospectId: string;
  isFavorite: boolean;
  /** 'card' = small, inline star in card action bar | 'header' = larger, in detail header */
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
            ? 'bg-amber-50 text-amber-600 border border-amber-200'
            : 'bg-white text-gray-400 border border-gray-200 hover:bg-amber-50 hover:text-amber-500',
        ].join(' ')}
      >
        <Star
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
        'w-[38px] h-[38px] shrink-0 flex items-center justify-center rounded-full border shadow-sm transition-all active:scale-95',
        optimistic
          ? 'bg-amber-50 text-amber-500 border-amber-200'
          : 'bg-white text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-400',
      ].join(' ')}
    >
      <Star
        className="w-4 h-4"
        fill={optimistic ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
    </button>
  );
}
