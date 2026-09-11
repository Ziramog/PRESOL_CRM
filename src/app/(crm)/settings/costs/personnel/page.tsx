import { getPersonnelCosts } from '@/app/actions/costs/admin';
import { PersonnelAdminClient } from '@/components/crm/settings/PersonnelAdminClient';

export default async function PersonnelAdminPage() {
  const personnel = await getPersonnelCosts();

  return (
    <div className="p-6">
      <PersonnelAdminClient initialPersonnel={personnel || []} />
    </div>
  );
}
