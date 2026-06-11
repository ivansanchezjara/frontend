"use client";
import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { getProductos, getVariantes } from '@/services/apis/catalogo';
import { Modal, Button, Input, Field, Toggle } from '@/components/ui';

export default function PromocionForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    nombre: '',
    nivel: 'variante',
    variante: null,
    producto: null,
    cantidad_minima: '',
    tipo_descuento: 'porcentaje',
    valor: '',
    vigencia_desde: '',
    vigencia_hasta: '',
    activo: true,
  });
  const [searchProducto, setSearchProducto] = useState('');
  const [searchVariante, setSearchVariante] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: productosData } = useApi(getProductos, {
    auto: true,
    args: [{ search: searchProducto, page_size: 20 }],
  });
  const { data: variantesData } = useApi(getVariantes, {
    auto: true,
    args: [{ search: searchVariante, page_size: 20 }],
  });

  const productos = productosData?.results || productosData || [];
  const variantes = variantesData?.results || variantesData || [];

  useEffect(() => {
    if (initial) {
      setForm({
        nombre: initial.nombre || '',
        nivel: initial.nivel || 'variante',
        variante: initial.variante || null,
        producto: initial.producto || null,
        cantidad_minima: initial.cantidad_minima || '',
        tipo_descuento: initial.tipo_descuento || 'porcentaje',
        valor: initial.valor || '',
        vigencia_desde: initial.vigencia_desde ? initial.vigencia_desde.slice(0, 16) : '',
        vigencia_hasta: initial.vigencia_hasta ? initial.vigencia_hasta.slice(0, 16) : '',
        activo: initial.activo ?? true,
      });
    }
  }, [initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        cantidad_minima: parseInt(form.cantidad_minima),
        valor: parseFloat(form.valor),
        vigencia_desde: form.vigencia_desde ? new Date(form.vigencia_desde).toISOString() : null,
        vigencia_hasta: form.vigencia_hasta ? new Date(form.vigencia_hasta).toISOString() : null,
      };
      if (form.nivel === 'variante') {
        payload.producto = null;
      } else {
        payload.variante = null;
      }
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => setForm({ ...form, [key]: value });

  return (
    <Modal
      title={initial ? 'Editar Promoción' : 'Nueva Promoción por Volumen'}
      onClose={onClose}
      open
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre de la promoción">
          <Input
            value={form.nombre}
            onChange={(e) => update('nombre', e.target.value)}
            placeholder="Ej: Guantes x10 con 15% desc."
            required
          />
        </Field>

        <Field label="Nivel de aplicación">
          <select
            value={form.nivel}
            onChange={(e) => update('nivel', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            aria-label="Nivel de aplicación"
          >
            <option value="variante">Variante específica</option>
            <option value="producto">Cualquier variante del producto</option>
          </select>
        </Field>

        {form.nivel === 'variante' ? (
          <Field label="Variante">
            <input
              type="text"
              placeholder="Buscar variante..."
              value={searchVariante}
              onChange={(e) => setSearchVariante(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            />
            <select
              value={form.variante || ''}
              onChange={(e) => update('variante', parseInt(e.target.value) || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              aria-label="Seleccionar variante"
              required={form.nivel === 'variante'}
            >
              <option value="">Seleccionar variante...</option>
              {variantes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.product_code} - {v.nombre_variante}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Producto">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            />
            <select
              value={form.producto || ''}
              onChange={(e) => update('producto', parseInt(e.target.value) || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              aria-label="Seleccionar producto"
              required={form.nivel === 'producto'}
            >
              <option value="">Seleccionar producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.general_code} - {p.nombre_general}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad mínima">
            <Input
              type="number"
              min="1"
              value={form.cantidad_minima}
              onChange={(e) => update('cantidad_minima', e.target.value)}
              placeholder="Ej: 10"
              required
            />
          </Field>
          <Field label="Tipo de descuento">
            <select
              value={form.tipo_descuento}
              onChange={(e) => update('tipo_descuento', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              aria-label="Tipo de descuento"
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="precio_fijo">Precio unitario fijo ($)</option>
            </select>
          </Field>
        </div>

        <Field label={form.tipo_descuento === 'porcentaje' ? 'Porcentaje (%)' : 'Precio fijo (USD)'}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.valor}
            onChange={(e) => update('valor', e.target.value)}
            placeholder={form.tipo_descuento === 'porcentaje' ? 'Ej: 15' : 'Ej: 8.50'}
            required
          />
        </Field>

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
          <span className="text-sm text-slate-600">Promoción activa</span>
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
