'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

export function ExportProspectsButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export-prospects');
      
      if (!response.ok) {
        throw new Error('Error al generar el archivo Excel');
      }

      // Handle the blob download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'PRESOL_Prospectos.xlsx';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Hubo un problema al exportar los datos. Por favor, intentá nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      title="Exportar a Excel"
      className={`inline-flex items-center justify-center gap-2 w-9 h-9 sm:w-auto sm:px-4 sm:py-2 text-sm font-medium transition-colors rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
        isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'
      }`}
    >
      <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
      <span className="hidden sm:inline">
        {isExporting ? 'Exportando...' : 'Exportar'}
      </span>
    </button>
  );
}
