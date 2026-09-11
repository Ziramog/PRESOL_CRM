'use client';

import { useState } from 'react';
import { calculateQuoteAction } from '@/app/actions/quotes/calculateQuote';
import { createQuote } from '@/app/actions/quotes/createQuote';
import { useRouter } from 'next/navigation';
import { QuoteCalculationResult } from '@/lib/presol-cost-engine/types';

export function QuoteForm({ configurations, clients }: { configurations: any[], clients: any[] }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    clientId: '',
    operationType: 'Transporte estándar',
    configurationId: '',
    kmBaseToPickup: 0,
    kmPickupToDelivery: 0,
    kmDeliveryToBase: 0,
    loadingHours: 1,
    unloadingHours: 1,
    waitingHours: 0,
    transferHours: undefined as number | undefined,
    cargoWeightKg: 0,
    cargoLengthM: 0,
    cargoWidthM: 0,
    totalTransportHeightM: 0,
    craneLoading: false,
    craneUnloading: false,
    craneHours: 0,
    winchUsed: false,
    winchHours: 0,
    tolls: 0,
    permitsEscortGuide: 0,
    travelLodgingOther: 0,
    finalSellerPrice: undefined as number | undefined,
  });

  const [calculation, setCalculation] = useState<QuoteCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNum = (field: string, val: string) => {
    handleChange(field, val === '' ? '' : Number(val));
  };

  const handleCalculate = async () => {
    if (!formData.configurationId || !formData.clientId) {
      setError('Selecciona cliente y configuración');
      return;
    }
    setError('');
    setIsCalculating(true);
    
    const payload = {
      ...formData,
      kmBaseToPickup: Number(formData.kmBaseToPickup) || 0,
      kmPickupToDelivery: Number(formData.kmPickupToDelivery) || 0,
      kmDeliveryToBase: Number(formData.kmDeliveryToBase) || 0,
      loadingHours: Number(formData.loadingHours) || 0,
      unloadingHours: Number(formData.unloadingHours) || 0,
      waitingHours: Number(formData.waitingHours) || 0,
      transferHours: formData.transferHours ? Number(formData.transferHours) : undefined,
      cargoWeightKg: Number(formData.cargoWeightKg) || 0,
      cargoLengthM: Number(formData.cargoLengthM) || 0,
      cargoWidthM: Number(formData.cargoWidthM) || 0,
      totalTransportHeightM: Number(formData.totalTransportHeightM) || 0,
      craneHours: Number(formData.craneHours) || 0,
      winchHours: Number(formData.winchHours) || 0,
      tolls: Number(formData.tolls) || 0,
      permitsEscortGuide: Number(formData.permitsEscortGuide) || 0,
      travelLodgingOther: Number(formData.travelLodgingOther) || 0,
      finalSellerPrice: formData.finalSellerPrice ? Number(formData.finalSellerPrice) : undefined
    };

    const res = await calculateQuoteAction(payload);
    if (res.success && res.calculation) {
      setCalculation(res.calculation);
    } else {
      setError(res.error || 'Error al calcular');
    }
    setIsCalculating(false);
  };

  const handleSave = async () => {
    if (!calculation) return;
    setIsSaving(true);
    const client = clients.find(c => c.id === formData.clientId);
    const res = await createQuote(formData, formData.clientId, client?.company_name || '');
    if (res.success) {
      router.push(`/quotes`); // list
    } else {
      setError(res.error || 'Error al guardar');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Formulario (Columna Izquierda) */}
      <div className="flex-1 space-y-6 bg-white p-6 rounded-none border border-gray-200">
        
        {error && <div className="p-3 bg-red-100 text-red-800 rounded-none">{error}</div>}

        <div>
          <h3 className="text-lg font-medium mb-4">Datos Comerciales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente</label>
              <select 
                className="w-full border rounded-none p-2"
                value={formData.clientId}
                onChange={e => handleChange('clientId', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Configuración Operativa</label>
              <select 
                className="w-full border rounded-none p-2"
                value={formData.configurationId}
                onChange={e => handleChange('configurationId', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {configurations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Rutas y Distancias (Km)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Base → Retiro</label>
              <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.kmBaseToPickup} onChange={e => handleNum('kmBaseToPickup', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Retiro → Entrega</label>
              <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.kmPickupToDelivery} onChange={e => handleNum('kmPickupToDelivery', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entrega → Base</label>
              <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.kmDeliveryToBase} onChange={e => handleNum('kmDeliveryToBase', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Tiempos (Horas)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Carga</label>
              <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.loadingHours} onChange={e => handleNum('loadingHours', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descarga</label>
              <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.unloadingHours} onChange={e => handleNum('unloadingHours', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Espera</label>
              <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.waitingHours} onChange={e => handleNum('waitingHours', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Carga y Dimensiones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Peso (kg)</label>
              <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.cargoWeightKg} onChange={e => handleNum('cargoWeightKg', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Largo (m)</label>
              <input type="number" inputMode="decimal" step="0.1" className="w-full border rounded-none p-2" value={formData.cargoLengthM} onChange={e => handleNum('cargoLengthM', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ancho (m)</label>
              <input type="number" inputMode="decimal" step="0.1" className="w-full border rounded-none p-2" value={formData.cargoWidthM} onChange={e => handleNum('cargoWidthM', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alto (m)</label>
              <input type="number" inputMode="decimal" step="0.1" className="w-full border rounded-none p-2" value={formData.totalTransportHeightM} onChange={e => handleNum('totalTransportHeightM', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Servicios Adicionales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4 border p-4 rounded-none">
              <div className="space-y-2">
                <button 
                  type="button" 
                  onClick={() => handleChange('craneLoading', !formData.craneLoading)}
                  className={`w-full py-2 px-4 rounded-none border text-sm font-medium transition-colors ${formData.craneLoading ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Carga con hidrogrúa
                </button>
                <button 
                  type="button" 
                  onClick={() => handleChange('craneUnloading', !formData.craneUnloading)}
                  className={`w-full py-2 px-4 rounded-none border text-sm font-medium transition-colors ${formData.craneUnloading ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Descarga con hidrogrúa
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Horas Hidrogrúa</label>
                <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.craneHours} onChange={e => handleNum('craneHours', e.target.value)} disabled={!formData.craneLoading && !formData.craneUnloading} />
              </div>
            </div>
            <div className="space-y-4 border p-4 rounded-none">
              <div className="space-y-2">
                <button 
                  type="button" 
                  onClick={() => handleChange('winchUsed', !formData.winchUsed)}
                  className={`w-full py-2 px-4 rounded-none border text-sm font-medium transition-colors ${formData.winchUsed ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Uso de malacate
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Horas Malacate</label>
                <input type="number" inputMode="decimal" className="w-full border rounded-none p-2" value={formData.winchHours} onChange={e => handleNum('winchHours', e.target.value)} disabled={!formData.winchUsed} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <button 
            type="button" 
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full py-3 bg-gray-900 text-white rounded-none font-medium hover:bg-gray-800"
          >
            {isCalculating ? 'Calculando...' : 'Calcular Cotización'}
          </button>
        </div>
      </div>

      {/* Resumen (Columna Derecha) */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-gray-50 p-6 rounded-none border border-gray-200 sticky top-6">
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
          
          {calculation ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Costo Estimado</span>
                <span className="font-medium">${calculation.estimatedTotalCost.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio Técnico</span>
                <span className="font-medium">${calculation.technicalPrice.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-blue-700 font-medium pt-2 border-t">
                <span>Precio Recomendado</span>
                <span>${calculation.recommendedPrice.toLocaleString('es-AR')}</span>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-sm font-medium mb-1">Precio Final (Vendedor)</label>
                <input 
                  type="number" 
                  inputMode="decimal"
                  className="w-full border rounded-none p-2 text-lg font-bold" 
                  value={formData.finalSellerPrice ?? calculation.recommendedPrice} 
                  onChange={e => handleNum('finalSellerPrice', e.target.value)} 
                  onBlur={handleCalculate}
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span>Margen</span>
                  <span className={`font-bold ${calculation.marginStatus === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                    {(calculation.finalMarginRatio * 100).toFixed(1)}% 
                    {calculation.marginStatus !== 'OK' && ' (Requiere Autorización)'}
                  </span>
                </div>
              </div>

              {calculation.controls.messages.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-none text-sm space-y-1">
                  <strong>Controles Operativos:</strong>
                  <ul className="list-disc pl-4">
                    {calculation.controls.messages.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}

              <button 
                type="button" 
                onClick={handleSave}
                disabled={isSaving || calculation.operationalStatus === 'REVIEW_REQUIRED'}
                className="w-full py-3 bg-blue-600 text-white rounded-none font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Emitir Cotización'}
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Completa los datos y presiona Calcular
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
