'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PROSPECT_STATUS } from '@/lib/constants';
import { ArrowUpDown, ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';

type SortDir = 'asc' | 'desc';

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  align?: 'right';
}

const COLUMNS: Column[] = [
  { key: 'external_id', label: 'ID', sortable: true },
  { key: 'company_name', label: 'Empresa', sortable: true },
  { key: 'city', label: 'Ciudad', sortable: true },
  { key: 'class', label: 'Clase', sortable: true },
  { key: 'commercial_category', label: 'Categoría', sortable: true },
  { key: 'contact_status', label: 'Estado', sortable: true },
  { key: 'actions', label: 'Acciones', sortable: false, align: 'right' },
];

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-50 text-blue-700',
  interested: 'bg-amber-50 text-amber-700',
  opportunity: 'bg-purple-50 text-purple-700',
  quote: 'bg-indigo-50 text-indigo-700',
  customer: 'bg-emerald-50 text-emerald-700',
  discarded: 'bg-red-50 text-red-500',
};

const CLASS_STYLE: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-gray-100 text-gray-700',
};

export function ProspectTable({
  prospects,
  currentSort,
  currentDir,
}: {
  prospects: any[];
  currentSort?: string;
  currentDir?: SortDir;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = (colKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSort === colKey) {
      // Toggle direction
      params.set('dir', currentDir === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', colKey);
      params.set('dir', 'asc');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (currentSort !== colKey) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-30 group-hover:opacity-70 transition-opacity" />;
    if (currentDir === 'asc') return <ArrowUp className="w-3.5 h-3.5 ml-1 text-gray-900" />;
    return <ArrowDown className="w-3.5 h-3.5 ml-1 text-gray-900" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3 text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400 ${
                  col.align === 'right' ? 'text-right' : ''
                }`}
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="group flex items-center gap-0.5 hover:text-gray-700 transition-colors"
                  >
                    {col.label}
                    <SortIcon colKey={col.key} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {prospects.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                No se encontraron prospectos.
              </td>
            </tr>
          ) : (
            prospects.map((prospect) => (
              <tr
                key={prospect.id}
                className="hover:bg-gray-50/80 transition-colors group"
              >
                {/* ID */}
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs text-gray-400">{prospect.external_id ?? '—'}</span>
                </td>

                {/* Empresa */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/prospects/${prospect.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {prospect.company_name}
                    </Link>
                    {prospect.has_direction_note && (
                      <span
                        title="Tiene nota de dirección"
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 shrink-0"
                      >
                        <MessageSquare className="w-3 h-3" strokeWidth={2} />
                      </span>
                    )}
                  </div>
                </td>

                {/* Ciudad */}
                <td className="px-5 py-3.5 text-gray-500 text-sm">
                  {prospect.city || <span className="text-gray-300">—</span>}
                </td>

                {/* Clase */}
                <td className="px-5 py-3.5">
                  {prospect.class ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        CLASS_STYLE[prospect.class] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {prospect.class}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Categoría */}
                <td className="px-5 py-3.5 text-gray-500 text-sm">
                  {prospect.commercial_category || <span className="text-gray-300">—</span>}
                </td>

                {/* Estado */}
                <td className="px-5 py-3.5">
                  {prospect.contact_status ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_STYLE[prospect.contact_status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {PROSPECT_STATUS[prospect.contact_status as keyof typeof PROSPECT_STATUS] ??
                        prospect.contact_status}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/prospects/${prospect.id}`}
                    className="text-xs font-semibold text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    Ver ficha →
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
