'use client';

import { useState, useRef } from 'react';
import { X, Smartphone, Clipboard, FileText, Check, AlertCircle } from 'lucide-react';

interface ImportedContact {
  name?: string;
  phone?: string;
  additionalPhones?: string[];
  email?: string;
}

interface MobileContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contact: ImportedContact) => void;
}

function parseVCard(vcfText: string): ImportedContact {
  const result: ImportedContact = {};
  const lines = vcfText.split(/\r\n|\r|\n/);
  const phones: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('FN:') || line.startsWith('FN;')) {
      result.name = line.replace(/^FN[^:]*:/, '').trim();
    } else if (!result.name && (line.startsWith('N:') || line.startsWith('N;'))) {
      const parts = line.replace(/^N[^:]*:/, '').split(';').filter(Boolean);
      result.name = parts.reverse().join(' ').trim();
    } else if (line.toUpperCase().includes('TEL')) {
      const tel = line.replace(/^[^:]*:/, '').trim().replace(/[\s-]/g, '');
      if (tel) phones.push(tel);
    } else if (line.toUpperCase().includes('EMAIL')) {
      const email = line.replace(/^[^:]*:/, '').trim();
      if (email) result.email = email;
    }
  }

  if (phones.length > 0) {
    result.phone = phones[0];
    result.additionalPhones = phones.slice(1);
  }
  return result;
}

function extractContactFromText(text: string): ImportedContact {
  const result: ImportedContact = {};

  // 1. Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0];

  // 2. Phones
  const phoneMatches = text.match(/(?:\+?\d{1,4}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g);
  if (phoneMatches) {
    const cleanPhones = phoneMatches
      .map(p => p.trim())
      .filter(p => p.replace(/\D/g, '').length >= 7);

    if (cleanPhones.length > 0) {
      result.phone = cleanPhones[0].replace(/[\s-]/g, '');
      result.additionalPhones = cleanPhones.slice(1).map(p => p.replace(/[\s-]/g, ''));
    }
  }

  // 3. Name heuristics (first line if it doesn't contain digits or email)
  const firstLine = text.split('\n')[0]?.trim();
  if (firstLine && firstLine.length < 50 && !firstLine.includes('@') && !/\d{5,}/.test(firstLine)) {
    result.name = firstLine.replace(/^(contacto|nombre|empresa|sr|sra|ing|lic)[:\s-]*/i, '').trim();
  }

  return result;
}

export function MobileContactImportModal({
  isOpen,
  onClose,
  onImport
}: MobileContactImportModalProps) {
  const [pasteText, setPasteText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClipboard = async () => {
    setFeedback(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const parsed = extractContactFromText(text);
          if (parsed.phone || parsed.email || parsed.name) {
            onImport(parsed);
            onClose();
            return;
          }
        }
      }
      setFeedback('No se detectó un número en el portapapeles. Podés pegar el texto abajo.');
    } catch {
      setFeedback('Permiso de portapapeles bloqueado por Firefox. Pegá el texto abajo directamente.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseVCard(content);
        if (parsed.phone || parsed.name || parsed.email) {
          onImport(parsed);
          onClose();
        } else {
          setFeedback('No se pudieron extraer datos válidos del archivo vCard.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleManualParse = () => {
    if (!pasteText.trim()) return;
    const parsed = extractContactFromText(pasteText);
    if (parsed.phone || parsed.email || parsed.name) {
      onImport(parsed);
      onClose();
    } else {
      setFeedback('No se detectó ningún número de teléfono en el texto.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-[15px]">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            Traer contacto desde móvil
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Feedback message */}
          {feedback && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Option 1: Clipboard One-Tap */}
          <div>
            <button
              type="button"
              onClick={handleClipboard}
              className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm"
            >
              <Clipboard className="w-4 h-4" />
              Pegar desde el Portapapeles
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-1">
              Copiá un número o mensaje de WhatsApp y tocalo para extraerlo
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] font-bold text-gray-400 uppercase">o también</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Option 2: vCard .vcf File Picker */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".vcf,text/vcard,text/x-vcard"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              Seleccionar archivo de contacto (.vcf)
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-1">
              Compartir contacto desde tu agenda → Guardar como .vcf
            </p>
          </div>

          {/* Option 3: Manual Paste Text Box */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
            <label className="block text-xs font-semibold text-gray-700">
              Pegar texto o tarjeta de contacto:
            </label>
            <textarea
              rows={3}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Pegá aquí cualquier texto con teléfono (ej: mensaje de WhatsApp o tarjeta de presentación)..."
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              type="button"
              onClick={handleManualParse}
              disabled={!pasteText.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Extraer teléfono y aplicar
            </button>
          </div>

          {/* Firefox compatibility note */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-900/80 leading-relaxed">
            <span className="font-bold text-blue-900 block mb-0.5">ℹ️ Nota sobre Firefox en Android</span>
            Por políticas de privacidad de Mozilla, Firefox no incluye el lector directo de contactos de Google. Podés usar las opciones de arriba o acceder desde <strong>Chrome en tu celular</strong> para selección directa con 1 toque.
          </div>
        </div>
      </div>
    </div>
  );
}
