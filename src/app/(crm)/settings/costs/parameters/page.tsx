import { getAdminParameters, getAdminOperationMargins } from '@/app/actions/costs/admin';
import { ParametersAdminClient } from '@/components/crm/settings/ParametersAdminClient';

export default async function ParametersAdminPage() {
  const parameters = await getAdminParameters();
  const margins = await getAdminOperationMargins();

  return (
    <div className="p-6">
      <ParametersAdminClient 
        initialParameters={parameters || []} 
        initialMargins={margins || []} 
      />
    </div>
  );
}
