"use client";
import { useState } from 'react';
import { Modal, Button, Input, Field } from '@/components/ui';

const CAMPOS = [
  { value: 'precio_0_publico', label: 'Precio Público' },
  { value: 'precio_1_estudiante', label: 'Precio Estudiante' },
  { value: 'precio_2_reventa', label: 'Precio Reventa' },
  { value: 'precio_3_mayorista', label: 'Precio Mayorista' },
  { value: 'precio_4_intercompany', label: 'Precio Intercompany' },
  { value: 'costo_fob', label: 'Costo FOB' },
  { value: 'costo_landed', label: 'Costo Landed' },
];

const OPERACIONES = [
  { value: 'porcentaje_aumento', label: 'Aumento porcentual (%)' },
  { value: 'porcentaje_descuento', label: 'Descuento porcentual (%)' },
  { value: 'valor_fijo', label: 'Establecer valor fijo ($)' },
];

export default function BulkUpdateModal({ count, onConfirm, onClose }) {
  const [campo, setCampo] = useState('precio_0_publico');
  const [tipoOperacion, setTipoOperacion] = useState('porcentaje_aumento');
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valor || isNaN(parseFloat(valor))) return;
    setLoading(true);
    try {
      await onConfirm({
        campo,
        tipo_operacion: tipoOperacion,
        valor: parseFloat(valor),
      });
    } finally {
      setLoading(false);
    }
  };

  const getPreview = () => {
    const v = parseFloat(valor);
    if (!v || isNaN(v)) return '';
    const campoLabel = CAMPOS.find((c) => c.value === campo)?.label;
    if (tipoOperacion === 'porcentaje_aumento') return `+${v}% en ${campoLabel}`;
    if (tipoOperacion === 'porcentaje_descuento') return `-${v}% en ${campoLabel}`;
    return `$${v.toFixed(2)} fijo en ${campoLabel}`;
  };

  return (
    <Modal title="Ajuste Masivo de Precios" onClose={onClose} open>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Aplicar cambio a <strong>{count}</strong> variante{count > 1 ? 's' : ''} seleccionada{count > 1 ? 's' : ''}.
        </p>

        <Field label="Campo a modificar">
          <select
            value={campo}
            onChange={(e) => setCampo(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            aria-label="Campo a modificar"
          >
            {CAMPOS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Tipo de operación">
          <select
            value={tipoOperacion}
            onChange={(e) => setTipoOperacion(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            aria-label="Tipo de operación"
          >
            {OPERACIONES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Valor">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={tipoOperacion.includes('porcentaje') ? 'Ej: 10' : 'Ej: 25.00'}
          />
        </Field>

        {getPreview() && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Vista previa: <strong>{getPreview()}</strong> para {count} variante{count > 1 ? 's' : ''}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" disabled={!valor || loading}>
            {loading ? 'Aplicando...' : 'Aplicar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
