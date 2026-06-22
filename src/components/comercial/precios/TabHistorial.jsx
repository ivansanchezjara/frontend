"use client";
import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getHistorialPrecios } from '@/services/apis/precios';
import {
  LoadingScreen, SearchBar, Pagination, Text, Heading, Badge, Input,
} from '@/components/ui';
import { History, User, Calendar, ArrowRight, Filter, X } from 'lucide-react';

const PAGE_SIZE = 30;

export default function TabHistorial() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const { data, loading, execute } = useApi(getHistorialPrecios, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const results = data?.results || [];
  const count = data?.count || 0;

  useEffect(() => {
    const params = { page, page_size: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (fechaDesde) params.fecha_desde = new Date(fechaDesde).toISOString();
    if (fechaHasta) params.fecha_hasta = new Date(fechaHasta + 'T23:59:59').toISOString();

    const timeoutId = setTimeout(() => execute(params), 50);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, fechaDesde, fechaHasta]);

  const clearFilters = () => {
    setFechaDesde('');
    setFechaHasta('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = fechaDesde || fechaHasta || search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <Heading level={5} className="text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Historial de Cambios de Precios
          </Heading>
          <Text variant="bodyXs" className="text-slate-500 mt-1">
            Registro de todas las modificaciones de costos y precios por variante
          </Text>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-1">
              <SearchBar
                value={search}
                onChange={(val) => { setSearch(val); setPage(1); }}
                placeholder="Buscar código o nombre..."
              />
            </div>
            <Input
              type="date"
              label="Desde"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
            />
            <Input
              type="date"
              label="Hasta"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
            />
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 transition"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <LoadingScreen message="Cargando historial..." />
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <Text variant="bodyMd" className="text-slate-500 font-medium">
            No se encontraron cambios de precios
          </Text>
          <Text variant="bodyXs" className="text-slate-400 mt-1">
            {hasActiveFilters
              ? 'Probá ajustando los filtros de búsqueda'
              : 'Los cambios aparecerán aquí cuando se modifiquen precios'}
          </Text>
        </div>
      ) : (
        <>
          {/* Timeline de cambios */}
          <div className="space-y-3">
            {results.map((record) => (
              <HistorialCard key={record.id} record={record} />
            ))}
          </div>

          <Pagination
            count={count}
            pageSize={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function HistorialCard({ record }) {
  const fecha = new Date(record.fecha);
  const fechaStr = fecha.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaStr = fecha.toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition-all group">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-3">
        {/* Info del producto */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Text variant="bodyXs" className="font-mono text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 uppercase">
                {record.product_code}
              </Text>
              <Text variant="bodySm" className="font-semibold text-slate-800">
                {record.nombre_variante}
              </Text>
            </div>
            {record.producto_nombre && record.producto_nombre !== '—' && (
              <Text variant="bodyXs" className="text-slate-400 mt-0.5">
                {record.producto_nombre}
              </Text>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {record.usuario}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {fechaStr} {horaStr}
          </span>
        </div>
      </div>

      {/* Cambios */}
      {record.cambios && record.cambios.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 pl-11">
          {record.cambios.map((cambio, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs"
            >
              <span className="font-semibold text-slate-600 shrink-0">
                {cambio.campo}:
              </span>
              <span className="text-red-500/80 line-through truncate">
                {formatValue(cambio.anterior)}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-emerald-700 font-bold truncate">
                {formatValue(cambio.nuevo)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatValue(val) {
  if (!val || val === '—') return '—';
  // Try to format as currency
  const num = parseFloat(val);
  if (!isNaN(num) && val.match(/^\d+\.?\d*$/)) {
    return `$${num.toFixed(2)}`;
  }
  return val;
}
