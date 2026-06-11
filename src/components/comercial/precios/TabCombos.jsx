"use client";
import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { getCombos, eliminarCombo } from '@/services/apis/precios';
import { LoadingScreen, EmptyState, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/ui';
import { useConfirm } from '@/components/ui';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import ComboForm from './ComboForm';

export default function TabCombos() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const { addToast } = useToast();
  const confirm = useConfirm();

  const { data, loading, refresh } = useApi(getCombos, { auto: true });
  const combos = data?.results || data || [];

  const handleDelete = async (combo) => {
    const ok = await confirm({
      title: 'Eliminar combo',
      message: `¿Eliminar "${combo.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await eliminarCombo(combo.id);
      addToast('Combo eliminado', 'success');
      refresh();
    } catch (err) {
      addToast('Error al eliminar', 'error');
    }
  };

  const handleEdit = (combo) => {
    setEditing(combo);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditing(null);
    refresh();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Packs de productos con precio fijo especial.
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Combo
        </Button>
      </div>

      {combos.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-slate-300" />}
          message="No hay combos configurados"
        />
      ) : (
        <div className="grid gap-4">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className={`p-4 border rounded-lg transition ${combo.activo ? 'bg-white' : 'bg-slate-50 opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{combo.nombre}</span>
                    <Badge variant={combo.activo ? 'success' : 'default'}>
                      {combo.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  {combo.descripcion && (
                    <p className="text-sm text-slate-500">{combo.descripcion}</p>
                  )}

                  {/* Items del combo */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(combo.items || []).map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs"
                      >
                        <span className="font-medium">{item.cantidad}x</span>
                        <span className="text-slate-600">{item.variante_code}</span>
                        <span className="text-slate-400">
                          (${parseFloat(item.precio_unitario || 0).toFixed(2)} c/u)
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* Precios */}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-slate-500">
                      Individual: <span className="line-through">${parseFloat(combo.precio_individual_total || 0).toFixed(2)}</span>
                    </span>
                    <span className="font-bold text-emerald-700">
                      Combo: ${parseFloat(combo.precio_combo).toFixed(2)}
                    </span>
                    {combo.ahorro > 0 && (
                      <Badge variant="success">
                        Ahorro: ${parseFloat(combo.ahorro).toFixed(2)}
                      </Badge>
                    )}
                  </div>

                  {(combo.vigencia_desde || combo.vigencia_hasta) && (
                    <div className="text-xs text-slate-400 mt-1">
                      Vigencia: {combo.vigencia_desde ? new Date(combo.vigencia_desde).toLocaleDateString('es-PY') : '∞'}
                      {' → '}
                      {combo.vigencia_hasta ? new Date(combo.vigencia_hasta).toLocaleDateString('es-PY') : '∞'}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleEdit(combo)}
                    className="p-2 rounded hover:bg-slate-100 text-slate-500"
                    aria-label="Editar combo"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(combo)}
                    className="p-2 rounded hover:bg-red-50 text-red-400"
                    aria-label="Eliminar combo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <ComboForm
          initial={editing}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
