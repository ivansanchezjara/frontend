"use client";
import { useState, useEffect } from 'react';
import { PageHeader, SearchBar, Pagination, LoadingScreen, DataTable, ColumnSelector, Text, Heading, Button, Badge, Modal, Input } from '@/components/ui';
import { useToast } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import {
  getPreciosVariantes, actualizarPrecioVariante,
  bulkUpdatePrecios, getPreciosStats,
} from '@/services/apis/precios';
import {
  DollarSign, Percent, Package, Hash, AlertTriangle, Tag, Clock,
  Check, X,
} from 'lucide-react';

import TabPromociones from '@/components/comercial/precios/TabPromociones';
import TabCombos from '@/components/comercial/precios/TabCombos';
import TabHistorial from '@/components/comercial/precios/TabHistorial';
import BulkUpdateModal from '@/components/comercial/precios/BulkUpdateModal';

const TABS = [
  { id: 'precios', label: 'Lista de Precios', icon: DollarSign },
  { id: 'promociones', label: 'Promociones por Volumen', icon: Percent },
  { id: 'combos', label: 'Combos / Packs', icon: Package },
  { id: 'historial', label: 'Historial de Cambios', icon: Clock },
];

const PRECIO_FIELDS = [
  { key: 'costo_fob', label: 'FOB', color: 'text-slate-600' },
  { key: 'costo_landed', label: 'Landed', color: 'text-slate-600' },
  { key: 'precio_0_publico', label: 'Público', color: 'text-emerald-700' },
  { key: 'precio_1_estudiante', label: 'Estudiante', color: 'text-blue-700' },
  { key: 'precio_2_reventa', label: 'Reventa', color: 'text-purple-700' },
  { key: 'precio_3_mayorista', label: 'Mayorista', color: 'text-amber-700' },
  { key: 'precio_4_intercompany', label: 'Interco.', color: 'text-rose-700' },
  { key: 'precio_oferta', label: 'Oferta', color: 'text-red-600' },
];

const PAGE_SIZE = 25;

// Opciones para el ColumnSelector
const COLUMNAS_PRECIOS = [
  { id: 'product_code', label: 'Código', required: true },
  { id: 'nombre_variante', label: 'Producto / Variante', required: true },
  { id: 'costo_fob', label: 'Costo FOB' },
  { id: 'costo_landed', label: 'Costo Landed' },
  { id: 'precio_0_publico', label: 'Precio Público' },
  { id: 'precio_1_estudiante', label: 'Precio Estudiante' },
  { id: 'precio_2_reventa', label: 'Precio Reventa' },
  { id: 'precio_3_mayorista', label: 'Precio Mayorista' },
  { id: 'precio_4_intercompany', label: 'Precio Intercompany' },
  { id: 'precio_oferta', label: 'Precio Oferta' },
  { id: 'tasa_iva', label: 'IVA' },
  { id: '_actions', label: 'Acciones', required: true },
];

const COLUMNAS_VISIBLES_DEFAULT = [
  'product_code', 'nombre_variante',
  'precio_0_publico', 'precio_2_reventa', 'precio_3_mayorista',
  'precio_oferta', 'tasa_iva', '_actions',
];

const FILTER_OPTIONS = [
  { id: 'todos', label: 'Todos', color: 'bg-slate-100 text-slate-600' },
  { id: 'con_oferta', label: 'Con Oferta', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'sin_precio', label: 'Sin Precio', color: 'bg-amber-100 text-amber-700' },
];

export default function PreciosPage() {
  const [activeTab, setActiveTab] = useState('precios');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ categoria: '', con_oferta: '' });
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [columnasVisibles, setColumnasVisibles] = useState(COLUMNAS_VISIBLES_DEFAULT);

  const debouncedSearch = useDebounce(search, 400);
  const { addToast } = useToast();

  // Data fetching
  const { data: statsData } = useApi(getPreciosStats, { auto: true });
  const {
    data: preciosData,
    loading,
    execute: fetchPrecios,
  } = useApi(getPreciosVariantes, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const results = preciosData?.results || [];
  const count = preciosData?.count || 0;
  const stats = statsData || {};

  // Refetch when params change
  useEffect(() => {
    const params = { search: debouncedSearch, page, page_size: PAGE_SIZE };
    if (filtroStatus === 'con_oferta') params.con_oferta = 'true';
    if (filtroStatus === 'sin_precio') params.sin_precio = 'true';

    const timeoutId = setTimeout(() => {
      fetchPrecios(params);
    }, 50);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, filtroStatus]);

  // ─── Edición de Precios ────────────────────────────────────
  const startEditing = (variante) => {
    setEditingRow(variante);
    const vals = {};
    PRECIO_FIELDS.forEach((f) => {
      vals[f.key] = variante[f.key] ?? '';
    });
    vals.oferta_vence = variante.oferta_vence ? variante.oferta_vence.slice(0, 16) : '';
    vals.tasa_iva = variante.tasa_iva;
    setEditValues(vals);
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditValues({});
  };

  const saveRow = async () => {
    try {
      setSaving(true);
      const payload = {};
      PRECIO_FIELDS.forEach((f) => {
        const val = editValues[f.key];
        if (val !== '' && val !== null && val !== undefined) {
          payload[f.key] = parseFloat(val);
        } else if (f.key === 'precio_oferta') {
          payload[f.key] = null;
        }
      });
      if (editValues.oferta_vence) {
        payload.oferta_vence = new Date(editValues.oferta_vence).toISOString();
      } else {
        payload.oferta_vence = null;
      }
      payload.tasa_iva = parseInt(editValues.tasa_iva);

      await actualizarPrecioVariante(editingRow.id, payload);
      addToast('Precios actualizados correctamente', 'success');
      cancelEditing();
      fetchPrecios({ search: debouncedSearch, page, page_size: PAGE_SIZE, con_oferta: filtroStatus === 'con_oferta' ? 'true' : '', sin_precio: filtroStatus === 'sin_precio' ? 'true' : '' });
    } catch (err) {
      addToast('Error al guardar precios', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Selección bulk ────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === results.length) {
      setSelected([]);
    } else {
      setSelected(results.map((v) => v.id));
    }
  };

  const handleBulkUpdate = async (bulkData) => {
    try {
      const res = await bulkUpdatePrecios({
        variante_ids: selected,
        ...bulkData,
      });
      addToast(`${res.actualizadas} variantes actualizadas`, 'success');
      setSelected([]);
      setShowBulkModal(false);
      fetchPrecios({ search: debouncedSearch, page, page_size: PAGE_SIZE, con_oferta: filtroStatus === 'con_oferta' ? 'true' : '', sin_precio: filtroStatus === 'sin_precio' ? 'true' : '' });
    } catch (err) {
      addToast('Error en actualización masiva', 'error');
    }
  };

  // ─── Columnas para DataTable ───────────────────────────────
  const tableColumns = [
    {
      key: 'product_code',
      label: 'Código',
      required: true,
      resizable: true,
      width: 130,
      minWidth: 90,
      render: (val) => (
        <Text variant="bodyXs" className="font-mono text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 uppercase inline-block">
          {val}
        </Text>
      ),
    },
    {
      key: 'nombre_variante',
      label: 'Producto / Variante',
      required: true,
      resizable: true,
      width: 240,
      minWidth: 160,
      render: (val, row) => (
        <div>
          <Text variant="bodyXs" className="font-black text-slate-800 truncate leading-tight">
            {row.producto_nombre}
          </Text>
          <Text variant="bodyXs" className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate mt-0.5">
            {val}
          </Text>
        </div>
      ),
    },
    ...PRECIO_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      align: 'right',
      resizable: true,
      headerClassName: f.color,
      width: 90,
      minWidth: 70,
      render: (val, row) => {
        return (
          <span className={`font-mono text-xs ${f.color}`}>
            {val != null && parseFloat(val) !== 0
              ? `$${parseFloat(val).toFixed(2)}`
              : <span className="text-slate-300">—</span>
            }
          </span>
        );
      },
    })),
    {
      key: 'tasa_iva',
      label: 'IVA',
      align: 'right',
      resizable: true,
      width: 75,
      minWidth: 60,
      render: (val) => <Badge variant="subtle">{val}%</Badge>,
    },
    {
      key: '_actions',
      label: 'Acciones',
      align: 'center',
      required: true,
      resizable: true,
      width: 110,
      minWidth: 80,
      render: (_, row) => {
        return (
          <button
            onClick={(e) => { e.stopPropagation(); startEditing(row); }}
            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 transition"
            aria-label={`Editar precios de ${row.product_code}`}
          >
            Editar
          </button>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* HEADER */}
      <PageHeader
        title="Gestión de Precios"
        subtitle={
          <>
            <DollarSign size={12} /> Precios, promociones por volumen y combos
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="flex gap-1" aria-label="Tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg
                      border-b-2 transition-all
                      ${isActive
                        ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ═══════════ TAB: LISTA DE PRECIOS ═══════════ */}
          {activeTab === 'precios' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-slate-300 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center transition-all group-hover:scale-110">
                    <Hash size={16} />
                  </div>
                  <div>
                    <Text variant="label" className="mb-1">Total SKUs</Text>
                    <Heading level={4} className="leading-none">
                      {(stats.total_variantes || 0).toLocaleString()}
                    </Heading>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-amber-200 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center transition-all group-hover:scale-110">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <Text variant="label" className="mb-1">Sin Precio</Text>
                    <Heading level={4} className="leading-none">
                      {stats.sin_precio || 0}
                    </Heading>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-emerald-200 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all group-hover:scale-110">
                    <Tag size={16} />
                  </div>
                  <div>
                    <Text variant="label" className="mb-1">Oferta Activa</Text>
                    <Heading level={4} className="leading-none">
                      {stats.con_oferta_activa || 0}
                    </Heading>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-red-200 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center transition-all group-hover:scale-110">
                    <Clock size={16} />
                  </div>
                  <div>
                    <Text variant="label" className="mb-1">Ofertas Vencidas</Text>
                    <Heading level={4} className="leading-none">
                      {stats.ofertas_vencidas || 0}
                    </Heading>
                  </div>
                </div>
              </div>

              {/* Filtros sticky — pill buttons + buscador + columnas */}
              <div className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-[72px] z-40">
                <div className="flex flex-wrap gap-2 items-center">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setFiltroStatus(opt.id); setPage(1); }}
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroStatus === opt.id ? `${opt.color} shadow-lg shadow-current/10 ring-2 ring-current/20` : 'bg-white/50 text-slate-400 hover:bg-white hover:text-slate-600 border border-slate-100'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {selected.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setShowBulkModal(true)}
                    >
                      <Percent className="w-3.5 h-3.5 mr-1" />
                      Ajuste masivo ({selected.length})
                    </Button>
                  )}
                </div>
                <div className="w-full xl:max-w-xl flex items-center gap-3">
                  <div className="flex-1">
                    <SearchBar
                      value={search}
                      onChange={(val) => { setSearch(val); setPage(1); }}
                      placeholder="Buscar código, nombre, producto, marca..."
                    />
                  </div>
                  <ColumnSelector
                    opciones={COLUMNAS_PRECIOS}
                    visibles={columnasVisibles}
                    onChange={setColumnasVisibles}
                    defaultVisibles={COLUMNAS_VISIBLES_DEFAULT}
                  />
                </div>
              </div>

              {/* Tabla con DataTable */}
              <div className="w-full">
                {loading ? (
                  <LoadingScreen message="Cargando precios..." />
                ) : (
                  <>
                    <DataTable
                      columns={tableColumns}
                      data={results}
                      rowKey="id"
                      visibleColumns={columnasVisibles}
                      selectable
                      selected={selected}
                      onSelect={toggleSelect}
                      onSelectAll={toggleSelectAll}
                      activeRowId={editingRow?.id}
                      onRowClick={(row) => startEditing(row)}
                      fixedLayout
                      variant="rounded"
                      emptyMessage="No se encontraron variantes con esos filtros"
                      emptyIcon="💲"
                    />

                    <Pagination
                      count={count}
                      pageSize={PAGE_SIZE}
                      currentPage={page}
                      onPageChange={setPage}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ TAB: PROMOCIONES ═══════════ */}
          {activeTab === 'promociones' && <TabPromociones />}

          {/* ═══════════ TAB: COMBOS ═══════════ */}
          {activeTab === 'combos' && <TabCombos />}

          {/* ═══════════ TAB: HISTORIAL ═══════════ */}
          {activeTab === 'historial' && <TabHistorial />}

        </div>
      </div>

      {/* Modal Bulk Update */}
      {showBulkModal && (
        <BulkUpdateModal
          count={selected.length}
          onConfirm={handleBulkUpdate}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {/* Modal de Edición de Precios */}
      <Modal
        open={editingRow !== null}
        onClose={cancelEditing}
        title="Editar Precios y Costos"
        size="lg"
      >
        <div className="p-6 space-y-6">
          {editingRow && (
            <>
              {/* Información del Producto */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Text variant="label" className="text-slate-400">Producto / Variante</Text>
                  <Heading level={6} className="text-slate-800">
                    {editingRow.producto_nombre}
                  </Heading>
                  <Text variant="bodyXs" className="text-slate-500 font-medium">
                    {editingRow.nombre_variante}
                  </Text>
                </div>
                <div className="shrink-0">
                  <Text variant="bodyXs" className="font-mono text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 uppercase inline-block">
                    {editingRow.product_code}
                  </Text>
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                {/* Sección de Costos */}
                <div>
                  <Heading level={6} className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-black">
                    Costos (FOB / Landed)
                  </Heading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      step="0.01"
                      label="Costo FOB (USD)"
                      value={editValues.costo_fob ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, costo_fob: e.target.value })}
                      placeholder="0.00"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      label="Costo Landed (USD)"
                      value={editValues.costo_landed ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, costo_landed: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Sección de Precios */}
                <div>
                  <Heading level={6} className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-black">
                    Precios de Venta (USD)
                  </Heading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Input
                      type="number"
                      step="0.01"
                      label="Público"
                      value={editValues.precio_0_publico ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, precio_0_publico: e.target.value })}
                      placeholder="0.00"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      label="Estudiante"
                      value={editValues.precio_1_estudiante ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, precio_1_estudiante: e.target.value })}
                      placeholder="0.00"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      label="Reventa"
                      value={editValues.precio_2_reventa ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, precio_2_reventa: e.target.value })}
                      placeholder="0.00"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      label="Mayorista"
                      value={editValues.precio_3_mayorista ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, precio_3_mayorista: e.target.value })}
                      placeholder="0.00"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      label="Intercompany"
                      value={editValues.precio_4_intercompany ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, precio_4_intercompany: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Sección de Oferta e IVA */}
                <div>
                  <Heading level={6} className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-black">
                    Oferta & Impuestos
                  </Heading>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      type="number"
                      step="0.01"
                      label="Precio Oferta"
                      value={editValues.precio_oferta ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, precio_oferta: e.target.value })}
                      placeholder="0.00"
                    />
                    <Input
                      type="datetime-local"
                      label="Vencimiento Oferta"
                      value={editValues.oferta_vence ?? ''}
                      onChange={(e) => setEditValues({ ...editValues, oferta_vence: e.target.value })}
                    />
                    <div className="flex flex-col gap-1.5 w-full">
                      <Text as="label" variant="label" className="text-xs font-semibold text-slate-700">
                        Tasa IVA
                      </Text>
                      <select
                        value={editValues.tasa_iva ?? 10}
                        onChange={(e) => setEditValues({ ...editValues, tasa_iva: e.target.value })}
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-700 px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value={10}>10%</option>
                        <option value={5}>5%</option>
                        <option value={0}>Exento</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveRow}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
