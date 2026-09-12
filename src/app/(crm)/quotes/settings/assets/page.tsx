export const dynamic = 'force-dynamic';
import { getAssets } from '@/app/actions/costs/admin';
import { AssetsAdminClient } from '@/components/crm/settings/AssetsAdminClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AssetsAdminPage() {
  const assets = await getAssets();

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/quotes/settings" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a Configuración
        </Link>
      </div>
      <AssetsAdminClient initialAssets={assets || []} />
    </div>
  );
}
