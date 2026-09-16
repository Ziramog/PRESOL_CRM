'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Building2, User, Mail, Phone, Briefcase, Loader2 } from 'lucide-react';
import { createProspect } from '@/app/actions/prospects';
import { createContact } from '@/app/actions/contacts';
import { useRouter } from 'next/navigation';

export function BusinessCardScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [extractedData, setExtractedData] = useState<any>(null);
  const [existingCompany, setExistingCompany] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleCaptureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOpen(true);
    setIsProcessing(true);
    setError('');
    setExtractedData(null);
    setExistingCompany(null);

    try {
      const base64 = await toBase64(file);
      
      const res = await fetch('/api/process-business-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Error procesando la tarjeta');
      }

      setExtractedData(json.parsed);
      setExistingCompany(json.existingCompany);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsProcessing(false);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      let prospectId = existingCompany?.id;

      // 1. Create company if it doesn't exist
      if (!prospectId) {
        const formData = new FormData();
        formData.append('company_name', extractedData.companyName || 'Sin Nombre Empresa');
        // default class?
        formData.append('class', 'B'); 
        
        const res = await createProspect(formData);
        if (res.error) throw new Error(res.error);
        if (!res.prospect) throw new Error('No se devolvió el prospecto creado');
        
        prospectId = res.prospect.id;
      }

      // 2. Create contact
      if (extractedData.contactName || extractedData.email || extractedData.phone) {
        const contactData = new FormData();
        contactData.append('prospect_id', prospectId);
        contactData.append('full_name', extractedData.contactName || 'Contacto Desconocido');
        if (extractedData.roleTitle) contactData.append('role_title', extractedData.roleTitle);
        if (extractedData.phone) contactData.append('phone', extractedData.phone);
        if (extractedData.email) contactData.append('email', extractedData.email);
        contactData.append('is_primary', 'true');

        const contactRes = await createContact(contactData);
        if (contactRes.error) throw new Error(contactRes.error);
      }

      // Success
      setIsOpen(false);
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setExtractedData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <button
        onClick={handleCaptureClick}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
      >
        <Camera className="w-4 h-4" />
        Escanear Tarjeta
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative flex flex-col">
            
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10 rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900">Escanear Tarjeta Comercial</h2>
              <button
                onClick={() => !isSaving && setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                  <p className="text-gray-900 font-medium text-lg">Procesando imagen con IA...</p>
                  <p className="text-gray-500 text-sm mt-2 max-w-[250px]">
                    Extrayendo datos de contacto y verificando en la base de datos
                  </p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex flex-col items-center text-center">
                  <p className="font-medium mb-3">{error}</p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md transition-colors text-sm font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              ) : extractedData ? (
                <div className="space-y-5">
                  
                  {/* Status Banner */}
                  {existingCompany ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                      <div className="bg-green-100 p-1.5 rounded-full text-green-700 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-green-800 font-semibold text-sm">Empresa encontrada</h4>
                        <p className="text-green-700 text-xs mt-0.5">
                          El contacto se asociará a <strong>{existingCompany.company_name}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                      <div className="bg-blue-100 p-1.5 rounded-full text-blue-700 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-blue-800 font-semibold text-sm">Nueva Empresa Detectada</h4>
                        <p className="text-blue-700 text-xs mt-0.5">
                          Se creará un nuevo registro para <strong>{extractedData.companyName || 'esta empresa'}</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form fields */}
                  <div className="space-y-4 pt-2">
                    {!existingCompany && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Empresa
                        </label>
                        <input
                          type="text"
                          value={extractedData.companyName || ''}
                          onChange={(e) => handleFieldChange('companyName', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Nombre de la empresa"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Nombre Completo
                      </label>
                      <input
                        type="text"
                        value={extractedData.contactName || ''}
                        onChange={(e) => handleFieldChange('contactName', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> Cargo
                      </label>
                      <input
                        type="text"
                        value={extractedData.roleTitle || ''}
                        onChange={(e) => handleFieldChange('roleTitle', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Gerente de Ventas"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> Correo
                        </label>
                        <input
                          type="email"
                          value={extractedData.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="juan@ejemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> Teléfono
                        </label>
                        <input
                          type="tel"
                          value={extractedData.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="+54 9 11 ..."
                        />
                      </div>
                    </div>
                  </div>
                  
                </div>
              ) : null}
            </div>

            {/* Footer with Save Button */}
            {!isProcessing && !error && extractedData && (
              <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    'Confirmar y Guardar'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
