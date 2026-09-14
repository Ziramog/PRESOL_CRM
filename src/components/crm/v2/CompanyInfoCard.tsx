'use client';

import { MapPin, Phone, Globe, Mail, Briefcase, Building, ExternalLink, CheckCircle2, Circle, Building2, Copy, Info } from 'lucide-react';

interface CompanyInfoCardProps {
  prospect: any;
  dataQuality: {
    score: number;
    status: string;
    missing: string[];
  };
}

const CHECKLIST = [
  { key: 'company_name', label: 'Razón social' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Dirección' },
  { key: 'website', label: 'Sitio web' },
  { key: 'contact', label: 'Contacto principal' },
  { key: 'category', label: 'Rubro' },
  { key: 'email', label: 'Email' },
  { key: 'maps', label: 'Lat/Lng (Maps)' },
  { key: 'employee_count', label: 'Cantidad empleados' }
];

export function CompanyInfoCard({ prospect, dataQuality }: CompanyInfoCardProps) {
  const missingSet = new Set(dataQuality?.missing || []);
  const score = dataQuality?.score || 0;
  
  let colorClass = 'text-gray-500';
  let barColor = 'bg-gray-200';
  
  if (score >= 95) {
    colorClass = 'text-green-600';
    barColor = 'bg-green-500';
  } else if (score >= 80) {
    colorClass = 'text-blue-600';
    barColor = 'bg-green-500'; // mockup has green bar even at 80%
  } else if (score >= 40) {
    colorClass = 'text-yellow-600';
    barColor = 'bg-green-500';
  } else {
    colorClass = 'text-red-600';
    barColor = 'bg-green-500';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-500" />
          <h3 className="text-[15px] font-bold text-gray-900">Información de la empresa</h3>
        </div>
        <button className="text-[11px] text-blue-600 hover:underline font-medium">Editar</button>
      </div>
      
      <div className="space-y-4 mb-6">
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección" value={prospect.address || prospect.city} copyable />
        <InfoRow icon={<Phone className="w-4 h-4" />} label="Teléfonos" value={prospect.primary_phone || prospect.phones_raw} copyable />
        <InfoRow icon={<Globe className="w-4 h-4" />} label="Sitio web" value={prospect.website} link={prospect.website} />
        <InfoRow icon={<Mail className="w-4 h-4" />} label="Email general" value={prospect.email} copyable />
        <InfoRow icon={<Briefcase className="w-4 h-4" />} label="CUIT" value={prospect.cuit} copyable />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Maps" value={prospect.google_maps_url ? 'Ver en Google Maps' : null} link={prospect.google_maps_url} />
        <InfoRow icon={<Building className="w-4 h-4" />} label="LinkedIn" value={prospect.linkedin ? 'Ver perfil' : null} link={prospect.linkedin} />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13px] font-bold text-gray-900">Calidad de datos</h3>
            <Info className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className={`text-[15px] font-bold ${colorClass}`}>{score}%</span>
        </div>
        
        <div className="mb-4 mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${score}%` }}></div>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Información completa</div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] sm:text-[11px]">
          {CHECKLIST.map(item => {
            const isComplete = !missingSet.has(item.key);
            return (
              <div key={item.key} className="flex items-center gap-1.5">
                {isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                )}
                <span className={isComplete ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>{item.label}</span>
              </div>
            );
          })}
        </div>
        
        {score < 80 && (
          <button className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md text-xs font-semibold transition-colors">
            ✨ Enriquecer datos
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, link, copyable }: { icon: React.ReactNode; label: string; value: string | null | undefined; link?: string; copyable?: boolean }) {
  if (!value) {
    return (
      <div className="flex items-start gap-2.5 text-xs">
        <div className="text-gray-400 mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <span className="text-gray-500 font-medium block truncate">{label}</span>
          <span className="text-gray-300">—</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 text-xs">
      <div className="text-gray-400 mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-gray-500 font-medium block truncate">{label}</span>
        {link ? (
          <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
            <span className="truncate">{value}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="text-gray-900 break-words">{value}</span>
            {copyable && (
              <button 
                onClick={() => navigator.clipboard.writeText(value)}
                className="text-gray-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 outline-none"
                title={`Copiar ${label.toLowerCase()}`}
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
