"use client";
import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { getVariantes } from '@/services/apis/catalogo';
import { crearCombo, actualizarCombo } from '@/services/apis/precios';
import { Modal, Button, Input, Field, Toggle } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';

export default function ComboForm({ initial, onClose }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchVariante, setSearchVariante] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio_combo: '',
    vigencia_desde: '',
    vigencia_hasta: '',
    activo: true,
    items: [],
  });

  const { data: variantesData } = useApi(getVariantes, {
    auto: true,
    args: [{ search: searchVariante, page_size: 30 }],
  });
  const variantes = variantesData?.results || variantesData || [];

  useEffect(() => {
    if (initial) {
      setForm({
        nombre: initial.nombre || '',
        descripcion: initial.descripcion || '',
        precio_combo: initial.precio_combo || '',
        vigencia_desde: initial.vigencia_desde ? initial.vigencia_desde.slice(0, 16) : '',
        vigencia_hasta: initial.vigencia_hasta ? initial.vigencia_hasta.slice(0, 16) : '',
        activo: initial.activo ?? true,
        items: (initial.items || []).map((i) => ({
          variante: i.variante,
          variante_code: i.variante_code,
          variante_nombre: i.variante_nombre,
          cantidad: i.cantidad,
        })),
      });
    }
  }, [initial]);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { variante: null, cantidad: 1 }] });
  };

  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const updateItem = (index, key, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [key]: value };
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      addToast('Agrega al menos un ítem al combo', 'warning');
      return;
    }
    if (form.items.some((i) => !i.variante)) {
      addToast('Selecciona una variante para cada ítem', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio_combo: parseFloat(form.precio_combo),
        vigencia_desde: form.vigencia_desde ? new Date(form.vigencia_desde).toISOString() : null,
        vigencia_hasta: form.vigencia_hasta ? new Date(form.vigencia_hasta).toISOString() : null,
        activo: form.activo,
        items: form.items.map((i) => ({
          variante: parseInt(i.variante),
          cantidad: parseInt(i.cantidad),
        })),
      };

      if (initial) {
        await actualizarCombo(initial.id, payload);
        addToast('Combo actualizado', 'success');
      } else {
        await crearCombo(payload);
        addToast('Combo creado', 'success');
      }
      onClose();
    } catch (err) {
      addToast('Error al guardar el combo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calcular precio individual total para preview
  const precioIndividual = form.items.reduce((sum, item) => {
    if (!item.variante) return sum;
    const v = variantes.find((va) => va.id === parseInt(item.variante));
    if (!v) return sum;
    return sum + (parseFloat(v.precio_0_publico || 0) * (parseInt(item.cantidad) || 1));
  }, 0);

  return (
    <Modal
      title={initial ? 'Editar Combo' : 'Nuevo Combo'}
      onClose={onClose}
      open
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Field label="Nombre del combo">
          <Input
            value={form.nombre}
            onChange={(e) => update('nombre', e.target.value)}
            placeholder="Ej: Pack Implantología Básico"
            required
          />
        </Field>

        <Field label="Descripción (opcional)">
          <Input
            value={form.descripcion}
            onChange={(e) => update('descripcion', e.target.value)}
            placeholder="Descripción breve del combo..."
          />
        </Field>

        {/* Items del combo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Ítems del combo</label>
            <Button type="button" size="sm" variant="ghost" onClick={addItem}>
              <Plus className="w-3 h-3 mr-1" />
              Agregar ítem
            </Button>
          </div>

          {/* Buscador de variante */}
          <input
            type="text"
            placeholder="Buscar variante para agregar..."
            value={searchVariante}
            onChange={(e) => setSearchVariante(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />

          {form.items.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              Aún no hay ítems. Haz clic en &quot;Agregar ítem&quot; para empezar.
            </p>
          )}

          {form.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <select
                value={item.variante || ''}
                onChange={(e) => updateItem(idx, 'variante', e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                aria-label={`Variante del ítem ${idx + 1}`}
              >
                <option value="">Seleccionar variante...</option>
                {variantes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.product_code} - {v.nombre_variante}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                className="w-20"
                aria-label={`Cantidad del ítem ${idx + 1}`}
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="p-1.5 rounded hover:bg-red-50 text-red-400"
                aria-label={`Eliminar ítem ${idx + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Precio */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio del combo (USD)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.precio_combo}
              onChange={(e) => update('precio_combo', e.target.value)}
              placeholder="Ej: 45.00"
              required
            />
          </Field>
          <div className="flex flex-col justify-end">
            {precioIndividual > 0 && form.precio_combo && (
              <div className="text-sm space-y-1 pb-1">
                <div className="text-slate-500">
                  Individual: <span className="line-through">${precioIndividual.toFixed(2)}</span>
                </div>
                <div className="font-medium text-emerald-600">
                  Ahorro: ${(precioIndividual - parseFloat(form.precio_combo || 0)).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vigencia */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vigencia desde (opcional)">
            <Input
              type="datetime-local"
              value={form.vigencia_desde}
              onChange={(e) => update('vigencia_desde', e.target.value)}
            />
          </Field>
          <Field label="Vigencia hasta (opcional)">
            <Input
              type="datetime-local"
              value={form.vigencia_hasta}
              onChange={(e) => update('vigencia_hasta', e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <Toggle
            checked={form.activo}
            onChange={(val) => update('activo', val)}
          />
          <span className="text-sm text-slate-600">Combo activo</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (initial ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
