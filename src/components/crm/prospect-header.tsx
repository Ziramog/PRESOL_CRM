'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, MessageCircle, PlusCircle, Trash2, AlertTriangle, X, Edit, Building2, Factory, Mic, ChevronLeft, MoreHorizontal, ChevronRight, Heart, Calendar, Clock, User, ArrowUpRight, Mail, ChevronDown, UserPlus, Share } from 'lucide-react';
import { ActivityForm } from './activity-form';
import { TaskForm } from './task-form';
import { OpportunityForm } from './opportunity-form';
import { ProspectForm } from '@/components/crm/prospect-form';
import { ContactForm } from './contact-form';
import { VoiceRecorderModal } from './v2/VoiceRecorderModal';
import { updateProspectStatus, deleteProspect, toggleFavorite } from '@/app/actions/prospects';
import { getLeadTemperature, PulseIndicator } from '@/lib/lead-temperature';

import { PROSPECT_STATUS } from '@/lib/constants';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const STATUS_OPTIONS = Object.entries(PROSPECT_STATUS).map(([value, label]) => ({ value, label }));

function formatDateDistance(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
  
  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(d);
}

function formatFutureDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

export function ProspectHeader({ 
  prospect,
  contacts = [],
  availableCities = [], 
  availableSectors = [],
  latestActivity,
  nextTask
}: { 
  prospect: any,
  contacts?: any[],
  availableCities?: string[], 
  availableSectors?: string[],
  latestActivity?: any,
  nextTask?: any
}) {
  const router = useRouter();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'voice') {
        setShowVoiceModal(true);
        window.history.replaceState(null, '', `/prospects/${prospect.id}`);
      }
    }
  }, [prospect.id]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticFav, setOptimisticFav] = useState(prospect.is_favorite ?? false);

  const initialPrimary = contacts.find((c: any) => c.is_primary) || contacts[0];
  const [selectedContactId, setSelectedContactId] = useState<string | null>(initialPrimary?.id || null);

  useEffect(() => {
    if (contacts.length > 0 && (!selectedContactId || !contacts.some(c => c.id === selectedContactId))) {
      const primary = contacts.find((c: any) => c.is_primary) || contacts[0];
      setSelectedContactId(primary?.id || null);
    }
  }, [contacts, selectedContactId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteProspect(prospect.id);
    if (res.error) {
      setDeleteError(res.error);
      setIsDeleting(false);
    } else {
      router.push('/prospects');
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(() => {
      updateProspectStatus(prospect.id, newStatus);
    });
  };

  const handleToggleFavorite = () => {
    const prev = optimisticFav;
    setOptimisticFav(!prev);
    startTransition(async () => {
      const res = await toggleFavorite(prospect.id, prev);
      if (res?.error) {
        setOptimisticFav(prev);
      }
    });
  };

  const openMaps = () => {
    if (prospect.google_maps_url) {
      window.open(prospect.google_maps_url, '_blank');
    } else {
      const query = encodeURIComponent(`${prospect.company_name} ${prospect.city || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  // The active contact is the one selected in the dropdown (desktop) or primary (mobile)
  const selectedContact = contacts.find(c => c.id === selectedContactId) || initialPrimary;
  
  const activePhone = selectedContact?.phone || prospect.primary_phone;
  const cleanPhone = activePhone?.replace(/[^\d+]/g, '');
  const activeEmail = selectedContact?.email || prospect.email;

  const handleShareContact = () => {
    const contactName = selectedContact?.full_name || prospect.ask_for || prospect.company_name;
    const phone = cleanPhone || prospect.primary_phone?.replace(/[^\d+]/g, '') || '';
    const email = activeEmail || '';
    const org = prospect.company_name || '';
    
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contactName}
ORG:${org}
TEL;TYPE=WORK,VOICE:${phone}
EMAIL;TYPE=WORK:${email}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contactName.replace(/[^a-z0-9]/gi, '_')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button 
          onClick={() => router.push('/prospects')}
          className="flex items-center gap-2 text-[17px] font-medium text-slate-900 active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          Prospecto
        </button>
      </div>

      <div className="relative flex flex-col lg:flex-row lg:items-stretch lg:justify-between mb-4 bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* --- LEFT SECTION (Identity, Location, Buttons) --- */}
        <div className="flex flex-col min-w-0 flex-1 p-5 lg:p-6 lg:pr-8">
          
          {/* MOBILE ONLY: Top Action Bar (Status + Corner Icons) */}
          <div className="flex lg:hidden items-center justify-between mb-4 w-full">
            {/* Small Status */}
            <div className="relative inline-flex items-center">
              <select
                value={prospect.contact_status || 'pending'}
                onChange={handleStatusChange}
                disabled={isPending}
                className={`appearance-none cursor-pointer outline-none transition-colors border pl-7 pr-6 py-1 rounded-lg text-[11px] font-bold tracking-wide shadow-sm
                  ${isPending ? 'opacity-50' : ''}
                  ${prospect.contact_status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    prospect.contact_status === 'interested' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    prospect.contact_status === 'opportunity' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                    prospect.contact_status === 'quote' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                    prospect.contact_status === 'customer' ? 'bg-green-50 text-green-800 border-green-200' :
                    prospect.contact_status === 'discarded' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  }
                `}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
                <span className={`w-2 h-2 rounded-sm 
                  ${prospect.contact_status === 'in_progress' ? 'bg-blue-500' :
                    prospect.contact_status === 'interested' ? 'bg-emerald-500' :
                    prospect.contact_status === 'opportunity' ? 'bg-indigo-500' :
                    prospect.contact_status === 'quote' ? 'bg-purple-500' :
                    prospect.contact_status === 'customer' ? 'bg-green-500' :
                    prospect.contact_status === 'discarded' ? 'bg-rose-500' :
                    'bg-amber-500'
                  }
                `}></span>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-current opacity-60">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Corner Icons (Heart + Menu) */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleToggleFavorite}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors active:scale-90 shadow-sm ${optimisticFav ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              >
                <Heart className={`w-4 h-4 ${optimisticFav ? 'fill-rose-500' : ''}`} strokeWidth={optimisticFav ? 0 : 2} />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 bg-slate-50 transition-colors active:scale-90 shadow-sm"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <button onClick={() => { setShowMenu(false); setEditingContact(null); setShowContactModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left">
                        <UserPlus className="w-4 h-4 text-blue-600" /> Añadir contacto
                      </button>
                      <div className="w-full h-px bg-slate-100 my-1"></div>
                      <button onClick={() => { setShowMenu(false); setShowEditModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left">
                        <Edit className="w-4 h-4 text-slate-400" /> Editar prospecto
                      </button>
                      <div className="w-full h-px bg-slate-100 my-1"></div>
                      <button onClick={() => { setShowMenu(false); setShowDeleteModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left">
                        <Trash2 className="w-4 h-4 text-rose-500" /> Eliminar prospecto
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center sm:items-start text-left gap-3 mb-2 px-1">
            <div className="w-[64px] h-[64px] rounded-[16px] bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
            </div>
            
            <div className="flex flex-col mt-0.5 w-full">
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 leading-tight mb-1">
                  {prospect.company_name}
                </h1>
                <PulseIndicator temp={getLeadTemperature(prospect.last_manual_activity_at)} />
              </div>
              <p className="text-[13px] sm:text-[14px] text-slate-500 mb-2">
                Prospecto comercial
              </p>

              {/* Location & Sector */}
              <div className="flex items-center justify-start gap-3 text-[13px] text-slate-600 font-medium lg:mb-5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[120px] lg:max-w-none">{prospect.city || 'Sin ciudad'}</span>
                </div>
                <span className="text-slate-300 shrink-0">|</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Factory className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[120px] lg:max-w-none">{prospect.sector || prospect.commercial_category || 'Sin rubro'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full px-1 lg:px-0 mt-5 lg:mt-0">
            {/* Primary Action Button */}
            <button 
              onClick={() => setShowActivityForm(true)}
              className="w-full lg:w-auto lg:px-5 h-[54px] lg:h-[48px] bg-[#1456c2] text-white rounded-2xl lg:rounded-xl flex items-center justify-center gap-2.5 shadow-md hover:bg-blue-800 transition-all active:scale-[0.98] shrink-0"
            >
              <PlusCircle className="w-6 h-6 lg:w-4 lg:h-4" strokeWidth={2.5} />
              <span className="text-[16px] lg:text-[14px] font-semibold tracking-wide whitespace-nowrap">Registrar actividad</span>
            </button>

            {/* Compact Quick Actions (4 items) */}
            <div className="flex items-center justify-between lg:justify-start gap-3 lg:gap-2.5 w-full lg:w-auto mt-2 lg:mt-0">
              {/* Llamar */}
              {cleanPhone ? (
                <a href={`tel:${cleanPhone}`} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl lg:rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors active:scale-95 shrink-0" title={`Llamar a ${selectedContact?.full_name || prospect.company_name}`}>
                  <Phone className="w-6 h-6 lg:w-5 lg:h-5 text-blue-600" strokeWidth={2.5} />
                </a>
              ) : (
                <button 
                  onClick={() => {
                    setEditingContact(selectedContact || null);
                    setShowContactModal(true);
                  }} 
                  title="Añadir teléfono / contacto"
                  className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl lg:rounded-xl border border-dashed border-slate-300 bg-slate-50 shadow-sm flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors active:scale-95 group shrink-0"
                >
                  <Phone className="w-6 h-6 lg:w-5 lg:h-5 text-slate-400 group-hover:text-blue-600 transition-colors" strokeWidth={2.5} />
                </button>
              )}

              {/* Nota de Voz */}
              <button onClick={() => setShowVoiceModal(true)} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl lg:rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-colors active:scale-95 shrink-0">
                <Mic className="w-6 h-6 lg:w-5 lg:h-5 text-purple-600" strokeWidth={2.5} />
              </button>

              {/* WhatsApp */}
              {cleanPhone ? (
                <a href={`whatsapp://send?phone=${cleanPhone}`} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl lg:rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-[#25D366]/10 hover:border-[#25D366]/30 transition-colors active:scale-95 shrink-0" title={`Enviar WhatsApp a ${selectedContact?.full_name || prospect.company_name}`}>
                  <WhatsAppIcon className="w-7 h-7 lg:w-6 lg:h-6 text-[#25D366]" />
                </a>
              ) : (
                <button 
                  onClick={() => {
                    setEditingContact(selectedContact || null);
                    setShowContactModal(true);
                  }} 
                  title="Añadir teléfono / contacto"
                  className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl lg:rounded-xl border border-dashed border-slate-300 bg-slate-50 shadow-sm flex items-center justify-center hover:bg-[#25D366]/10 hover:border-[#25D366]/40 transition-colors active:scale-95 group shrink-0"
                >
                  <WhatsAppIcon className="w-7 h-7 lg:w-6 lg:h-6 text-slate-400 group-hover:text-[#25D366] transition-colors" />
                </button>
              )}

              {/* Ubicación */}
              <button onClick={openMaps} className="w-[52px] h-[52px] lg:w-[48px] lg:h-[48px] rounded-2xl lg:rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95 shrink-0">
                <MapPin className="w-6 h-6 lg:w-5 lg:h-5 text-blue-600" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* --- CENTER SECTION (Contact Selector - Integrated) --- */}
        <div className="flex flex-col w-full lg:w-[320px] lg:min-w-[280px] border-t border-slate-100 lg:border-t-0 lg:border-l lg:border-slate-200 p-5 lg:px-6 lg:py-6 bg-slate-50/30 lg:bg-transparent">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
              <User className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 truncate">
                {contacts.length > 1 ? `Contactos (${contacts.length})` : 'Contacto Principal'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {contacts.length > 1 && (
                <div className="relative">
                  <select 
                    className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold py-1 pl-2 pr-6 rounded-lg cursor-pointer outline-none hover:text-blue-600 transition-colors max-w-[125px] truncate"
                    value={selectedContactId || ''}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                  >
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {selectedContact && (
                <button
                  type="button"
                  onClick={() => { setEditingContact(selectedContact); setShowContactModal(true); }}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-colors shadow-xs active:scale-95 cursor-pointer"
                  title="Editar contacto"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => { setEditingContact(null); setShowContactModal(true); }}
                className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-xs active:scale-95 cursor-pointer"
                title="Añadir contacto"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {selectedContact ? (
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => { setEditingContact(selectedContact); setShowContactModal(true); }}
                title="Editar contacto"
                className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center font-bold text-[16px] shrink-0 border border-blue-100 transition-colors cursor-pointer group"
              >
                <span>{selectedContact?.full_name ? selectedContact.full_name.substring(0, 2).toUpperCase() : '??'}</span>
              </button>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px] font-extrabold text-slate-900 truncate">
                    {selectedContact?.full_name || 'Sin contacto'}
                  </span>
                  {selectedContact.is_primary && contacts.length > 1 && (
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shrink-0">
                      Principal
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-semibold text-blue-600 truncate mb-2">
                  {selectedContact?.role_title || selectedContact?.role || 'Sin cargo'}
                </span>
                
                <div className="flex flex-col gap-1.5">
                  {activePhone ? (
                    <div className="flex items-center justify-between gap-2 text-[13px] text-slate-700 font-bold">
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                        <a href={`tel:${cleanPhone || activePhone}`} className="truncate hover:text-blue-600 hover:underline">
                          {activePhone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={handleShareContact}
                          type="button"
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                          title="Guardar en Agenda (vCard)"
                        >
                          <Share className="w-4 h-4" />
                        </button>
                        <a 
                          href={`whatsapp://send?phone=${cleanPhone || activePhone.replace(/\D/g, '')}`} 
                          className="p-1.5 rounded-md text-[#25D366] hover:bg-[#25D366]/10 transition-colors shrink-0"
                          title="Enviar WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingContact(selectedContact); setShowContactModal(true); }}
                      className="flex items-center gap-1.5 text-[12px] text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-500" />
                      <span>+ Añadir teléfono</span>
                    </button>
                  )}
                  {activeEmail && (
                    <div className="flex items-center gap-2 text-[13px] text-slate-700 font-bold truncate">
                      <Mail className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={2.5} />
                      <a href={`mailto:${activeEmail}`} className="truncate hover:text-blue-600 hover:underline">
                        {activeEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {prospect.primary_phone || prospect.ask_for ? (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      Dato de referencia
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">De ficha</span>
                  </div>
                  {prospect.ask_for && (
                    <p className="text-[13px] text-slate-800 font-bold">
                      <span className="text-slate-500 font-normal text-xs">Contacto: </span>
                      {prospect.ask_for}
                    </p>
                  )}
                  {prospect.primary_phone && (
                    <div className="flex items-center justify-between text-[13px] text-slate-800 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <a href={`tel:${prospect.primary_phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                          {prospect.primary_phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={handleShareContact}
                          type="button"
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                          title="Guardar en Agenda (vCard)"
                        >
                          <Share className="w-4 h-4" />
                        </button>
                        <a 
                          href={`whatsapp://send?phone=${prospect.primary_phone.replace(/[^\d+]/g, '')}`} 
                          className="p-1 rounded text-[#25D366] hover:bg-[#25D366]/10"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContact({
                        full_name: prospect.ask_for || prospect.company_name || '',
                        phone: prospect.primary_phone || '',
                        email: prospect.email || '',
                        is_primary: true
                      });
                      setShowContactModal(true);
                    }}
                    className="mt-1 w-full py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Formalizar como contacto
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <User className="w-6 h-6 text-slate-300 mb-1.5" />
                  <p className="text-[13px] font-medium text-slate-500 mb-2.5">
                    No hay contactos registrados
                  </p>
                  <button
                    type="button"
                    onClick={() => { setEditingContact(null); setShowContactModal(true); }}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-98 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Añadir contacto telefónico
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- RIGHT SECTION (Global Actions - Integrated - Desktop Only) --- */}
        <div className="hidden lg:flex flex-col justify-between shrink-0 w-full lg:w-auto border-t border-slate-100 lg:border-t-0 lg:border-l lg:border-slate-200 p-5 lg:px-6 lg:py-6">
          
          {/* Status & Priority */}
          <div className="flex flex-col gap-2">
            <div className="relative inline-flex items-center w-full min-w-[200px]">
              <select
                value={prospect.contact_status || 'pending'}
                onChange={handleStatusChange}
                disabled={isPending}
                className={`appearance-none cursor-pointer outline-none transition-colors border pl-10 pr-8 py-2.5 rounded-xl text-[13px] font-bold tracking-wide w-full shadow-sm
                  ${isPending ? 'opacity-50' : ''}
                  ${prospect.contact_status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    prospect.contact_status === 'interested' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    prospect.contact_status === 'opportunity' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                    prospect.contact_status === 'quote' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                    prospect.contact_status === 'customer' ? 'bg-green-50 text-green-800 border-green-200' :
                    prospect.contact_status === 'discarded' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  }
                `}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <span className={`w-2.5 h-2.5 rounded-[4px] 
                  ${prospect.contact_status === 'in_progress' ? 'bg-blue-500' :
                    prospect.contact_status === 'interested' ? 'bg-emerald-500' :
                    prospect.contact_status === 'opportunity' ? 'bg-indigo-500' :
                    prospect.contact_status === 'quote' ? 'bg-purple-500' :
                    prospect.contact_status === 'customer' ? 'bg-green-500' :
                    prospect.contact_status === 'discarded' ? 'bg-rose-500' :
                    'bg-amber-500'
                  }
                `}></span>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-current opacity-60">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {prospect.priority === 'Alta' && (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-sm">
                <ArrowUpRight className="w-4 h-4" strokeWidth={3} />
                Alta prioridad
              </div>
            )}
          </div>

          {/* Action Icon Panel (Large Horizontal) */}
          <div className="flex items-center gap-3 mt-4">
            <button 
              onClick={handleToggleFavorite}
              title={optimisticFav ? "Quitar de favoritos" : "Agregar a favoritos"}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border ${optimisticFav ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-rose-400 hover:border-rose-100'}`}
            >
              <Heart className={`w-6 h-6 ${optimisticFav ? 'fill-rose-500' : ''}`} strokeWidth={optimisticFav ? 0 : 2} />
            </button>
            
            <button 
              onClick={() => setShowEditModal(true)}
              title="Editar prospecto"
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-blue-600 hover:border-blue-100"
            >
              <Edit className="w-6 h-6" strokeWidth={2} />
            </button>

            <button 
              onClick={() => setShowDeleteModal(true)}
              title="Eliminar prospecto"
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all border border-slate-200 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
            >
              <Trash2 className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>

        </div>
      </div>
      
      {showEditModal && (
        <ProspectForm 
          prospect={prospect}
          availableCities={availableCities}
          availableSectors={availableSectors}
          onClose={() => setShowEditModal(false)} 
        />
      )}
      
      {showVoiceModal && (
        <VoiceRecorderModal 
          prospectId={prospect.id} 
          onClose={() => setShowVoiceModal(false)} 
        />
      )}

      {showActivityForm && (
        <ActivityForm 
          prospectId={prospect.id} 
          onClose={() => setShowActivityForm(false)} 
        />
      )}
      
      {showTaskForm && (
        <TaskForm 
          prospectId={prospect.id} 
          onClose={() => setShowTaskForm(false)} 
        />
      )}

      {showOpportunityForm && (
        <OpportunityForm 
          prospectId={prospect.id} 
          onClose={() => setShowOpportunityForm(false)} 
        />
      )}

      {showContactModal && (
        <ContactForm 
          prospectId={prospect.id} 
          contact={editingContact} 
          onClose={() => {
            setShowContactModal(false);
            setEditingContact(null);
          }} 
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-sm w-full max-w-md shadow-2xl p-6 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-sm bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-light tracking-tight text-gray-900">
                  ¿Eliminar prospecto?
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {prospect.company_name}
                </p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  Esta acción no se puede deshacer. Se eliminarán permanentemente el prospecto y todas sus interacciones, tareas y contactos vinculados.
                </p>
                {deleteError && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-sm mt-3 font-medium">
                    {deleteError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors border border-gray-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-sm transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
