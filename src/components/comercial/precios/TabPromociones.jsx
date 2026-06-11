"use client";
import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import {
  getPromociones, crearPromocion, actualizarPromocion, eliminarPromocion,
} from '@/services/apis/precios';
import { LoadingScreen, EmptyState, Button, Badge, Modal, Field, Input } from '@/components/ui';
import { useToast } from '@/components/ui';
import { useConfirm } from '@/components/ui';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import PromocionForm from './PromocionForm';

export default function TabPromociones() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const { addToast } = useToast();
  const confirm = useConfirm();

  const { data, loading, refresh } = useApi(getPromociones, { auto: true });
  const promociones = data?.results || data || [];

  const handleSave = async (formData) => {
    try {
      if (editing) {
        await actualizarPromocion(editing.id, formData);
        addToast('Promoción actualizada', 'success');
      } else {
        await crearPromocion(formData);
        addToast('Promoción creada', 'success');
      }
      setShowForm(false);
      setEditing(null);
      refresh();
    } catch (err) {
      addToast('Error al guardar la promoción', 'error');
    }
  };

  const handleDelete = async (promo) => {
    const ok = await confirm({
      title: 'Eliminar promoción',
      message: `¿Eliminar "${promo.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await eliminarPromocion(promo.id);
      addToast('Promoción eliminada', 'success');
      refresh();
    } catch (err) {
      addToast('Error al eliminar', 'error');
    }
  };

  const handleEdit = (promo) => {
    setEditing(promo);
    setShowForm(true);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Descuentos automáticos cuando se alcanza una cantidad mínima de compra.
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva Promoción
        </Button>
      </div>

      {promociones.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-12 h-12 text-slate-300" />}
          message="No hay promociones por volumen configuradas"
        />
      ) : (
        <div className="grid gap-3">
          {promociones.map((promo) => (
            <div
              key={promo.id}
              className={`p-4 border rounded-lg flex items-center justify-between transition ${promo.activo ? 'bg-white' : 'bg-slate-50 opacity-60'}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{promo.nombre}</span>
                  <Badge variant={promo.activo ? 'success' : 'default'}>
                    {promo.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Badge variant="subtle">
                    {promo.nivel === 'variante' ? 'Variante' : 'Producto'}
                  </Badge>
                </div>
                <div className="text-sm text-slate-500">
                  ≥ {promo.cantidad_minima} uds →{' '}
                  {promo.tipo_descuento === 'porcentaje'
                    ? `${promo.valor}% descuento`
                    : `$${parseFloat(promo.valor).toFixed(2)} precio fijo`
                  }
                  {promo.variante_code && ` • ${promo.variante_code}`}
                  {promo.producto_nombre && ` • ${promo.producto_nombre}`}
                </div>
                {(promo.vigencia_desde || promo.vigencia_hasta) && (
                  <div className="text-xs text-slate-400">
                    Vigencia: {promo.vigencia_desde ? new Date(promo.vigencia_desde).toLocaleDateString('es-PY') : '∞'}
                    {' → '}
                    {promo.vigencia_hasta ? new Date(promo.vigencia_hasta).toLocaleDateString('es-PY') : '∞'}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(promo)}
                  className="p-2 rounded hover:bg-slate-100 text-slate-500"
                  aria-label="Editar promoción"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(promo)}
                  className="p-2 rounded hover:bg-red-50 text-red-400"
                  aria-label="Eliminar promoción"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <PromocionForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
