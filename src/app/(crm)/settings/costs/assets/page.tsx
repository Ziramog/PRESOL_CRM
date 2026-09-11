import { getAssets } from '@/app/actions/costs/admin';
import { AssetsAdminClient } from '@/components/crm/settings/AssetsAdminClient';

export default async function AssetsAdminPage() {
  const assets = await getAssets();

  return (
    <div className="p-6">
      <AssetsAdminClient initialAssets={assets || []} />
    </div>
  );
}
