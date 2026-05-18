"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { Trash2, Package, User, Calendar, Plus, Clock } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getBajas, aprobarBaja } from "@/services/apis/movimientos";
import MovimientosFilterBar from "@/components/movimientos/MovimientosFilterBar";
import MovimientoCard from "@/components/movimientos/MovimientoCard";
import Pagination from "@/components/ui/Pagination";

export default function BajasPage() {
  // Estados de filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    estado: ''
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  // Cargar bajas con useApi
  const {
    data: bajasData,
    loading,
    execute: fetchBajas,
  } = useApi(getBajas, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  // Cargar datos cuando cambian los filtros o la página
  useEffect(() => {
    fetchBajas({
      page,
      search: debouncedSearch,
      ...filters
    });
  }, [page, debouncedSearch, filters, fetchBajas]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Volver a la primera página al filtrar
  };

  const bajas = bajasData?.results || [];
  const totalCount = bajasData?.count || 0;

  const { execute: aprobarBajaAction } = useApi(aprobarBaja, {
    auto: false,
  });

  const handleAprobar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        "¿Confirmar aprobación de esta baja? El stock se descontará inmediatamente.",
      )
    )
      return;

    try {
      await aprobarBajaAction(id);
      fetchBajas();
    } catch (error) {
      // useErrorHandler ya muestra el mensaje
    }
  };

  const getMotivoLabel = (motivo) => {
    const motivos = {
      VENCIMIENTO: "Vencimiento",
      ROTURA: "Rotura / Daño",
      PERDIDA: "Pérdida",
      ERROR_STOCK: "Ajuste Stock",
    };
    return motivos[motivo] || motivo;
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión de Movimientos", href: "/movimientos" },
          { label: "Bajas de Inventario" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            <span>
              Registrá pérdidas, mermas o productos vencidos para darlos de
              baja.
            </span>
          </>
        }
      >
        <Link
          href="/movimientos/bajas/nuevo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
        >
          <Plus size={16} /> Nueva Baja
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <MovimientosFilterBar 
            searchTerm={searchTerm}
            setSearchTerm={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            filters={filters}
            handleFilterChange={handleFilterChange}
            onClear={() => {
              setSearchTerm('');
              setFilters({ fecha_inicio: '', fecha_fin: '', estado: '' });
              setPage(1);
            }}
            loading={loading}
            placeholder="Buscar por descripción o variante..."
          />

          {loading ? (
            <LoadingScreen message="Sincronizando bajas..." />
          ) : bajas.length === 0 ? (
            <EmptyState
              icon="📤"
              title="No hay bajas registradas"
              message="Aquí se listarán todos los productos descontados por rotura, vencimiento o pérdida."
              actionLabel="Nueva Baja"
              onAction={() =>
                (window.location.href = "/movimientos/bajas/nuevo")
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bajas.map((baja) => (
                <MovimientoCard
                  key={baja.id}
                  id={baja.id}
                  estado={baja.estado}
                  titulo={`${baja.cantidad} x ${baja.variante_nombre}`}
                  subtitulo={baja.observaciones}
                  customIcon={Trash2}
                  badges={[
                    { label: getMotivoLabel(baja.motivo), className: 'bg-amber-100 text-amber-700' }
                  ]}
                  info={[
                    { icon: Calendar, label: new Date(baja.fecha).toLocaleDateString() },
                    { icon: Clock, label: baja.deposito_nombre },
                    { icon: User, label: baja.usuario_nombre }
                  ]}
                  onApprove={handleAprobar}
                  approveLabel="Aprobar"
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {!loading && totalCount > PAGE_SIZE && (
            <Pagination 
              count={totalCount}
              pageSize={PAGE_SIZE}
              currentPage={page}
              onPageChange={setPage}
            />
          )}
        </div>
      </main>
    </div>
  );
}
