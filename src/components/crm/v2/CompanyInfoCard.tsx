import { MapPin, Phone, Globe, Mail, Briefcase, Building, ExternalLink } from 'lucide-react';

interface CompanyInfoCardProps {
  prospect: any;
}

export function CompanyInfoCard({ prospect }: CompanyInfoCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Información de Empresa</h3>
        <button className="text-xs text-blue-600 hover:underline font-medium">Editar</button>
      </div>
      
      <div className="flex-1 space-y-3">
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección" value={prospect.address || prospect.city} />
        <InfoRow icon={<Phone className="w-4 h-4" />} label="Teléfonos" value={prospect.primary_phone || prospect.phones_raw} />
        <InfoRow icon={<Globe className="w-4 h-4" />} label="Sitio web" value={prospect.website} link={prospect.website} />
        <InfoRow icon={<Mail className="w-4 h-4" />} label="Email general" value={prospect.email} />
        <InfoRow icon={<Briefcase className="w-4 h-4" />} label="CUIT" value={prospect.cuit} />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Maps" value={prospect.google_maps_url ? 'Ver en Google Maps' : null} link={prospect.google_maps_url} />
        <InfoRow icon={<Building className="w-4 h-4" />} label="LinkedIn" value={prospect.linkedin ? 'Ver perfil' : null} link={prospect.linkedin} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string | null | undefined; link?: string }) {
  if (!value) {
    return (
      <div className="flex items-start gap-3 text-sm">
        <div className="text-gray-400 mt-0.5">{icon}</div>
        <div className="flex-1">
          <span className="text-gray-500 font-medium block">{label}</span>
          <span className="text-gray-400">—</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div className="flex-1">
        <span className="text-gray-500 font-medium block">{label}</span>
        {link ? (
          <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
            {value}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-gray-900">{value}</span>
        )}
      </div>
    </div>
  );
}
