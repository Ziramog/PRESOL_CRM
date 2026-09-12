export const dynamic = 'force-dynamic';
import { getAdminParameters, getAdminOperationMargins } from '@/app/actions/costs/admin';
import { ParametersAdminClient } from '@/components/crm/settings/ParametersAdminClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ParametersAdminPage() {
  const parameters = await getAdminParameters();
  const margins = await getAdminOperationMargins();

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/quotes/settings" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a Configuración
        </Link>
      </div>
      <ParametersAdminClient 
        initialParameters={parameters || []} 
        initialMargins={margins || []} 
      />
    </div>
  );
}
