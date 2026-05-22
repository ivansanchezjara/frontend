"use client";
import { EmptyState, LoadingScreen, PageHeader, Pagination, Badge, Text } from '@/components/ui';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Package, User, Calendar, Plus, Clock, Tag, Hash, Edit3, Check, X } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getBajas, aprobarBaja, rechazarBaja } from "@/services/apis/movimientos";
import MovimientosFilterBar from "@/components/movimientos/MovimientosFilterBar";
import MovimientoCard from "@/components/movimientos/MovimientoCard";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function BajasPage() {
  const router = useRouter();
  const { confirm, danger } = useConfirm();
  const { showToast } = useToast();
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
  const [vista, setVista] = useState('grilla'); // 'grilla' | 'tabla'

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

  const { execute: aprobarBajaAction, loading: isAprobando } = useApi(aprobarBaja, {
    auto: false,
  });

  const { execute: rechazarBajaAction, loading: isRechazando } = useApi(rechazarBaja, {
    auto: false,
  });

  const handleAprobar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const isConfirmed = await confirm(
      "¿Confirmar aprobación de esta baja? El stock se descontará inmediatamente.",
      "Aprobar Baja"
    );
    if (!isConfirmed) return;

    try {
      await aprobarBajaAction(id);
      showToast("Baja aprobada con éxito", "success");
      fetchBajas();
    } catch (error) {
      showToast("Error al aprobar la baja", "error");
    }
  };

  const handleRechazar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const isConfirmed = await danger(
      "¿Confirmar rechazo de esta baja? Esta acción es irreversible.",
      "Rechazar Baja"
    );
    if (!isConfirmed) return;

    try {
      await rechazarBajaAction(id);
      showToast("Baja rechazada", "info");
      fetchBajas();
    } catch (error) {
      showToast("Error al rechazar la baja", "error");
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
            Registrá pérdidas, mermas o productos vencidos para darlos de
              baja.
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
            vista={vista}
            setVista={setVista}
          />

          {loading ? (
            <LoadingScreen message="Sincronizando bajas..." />
          ) : bajas.length === 0 ? (
            <EmptyState
              icon={<Trash2 size={48} className="text-slate-300 mx-auto mb-4" />}
              title="No hay bajas registradas"
              message="Aquí se listarán todos los productos descontados por rotura, vencimiento o pérdida."
              actionLabel="Nueva Baja"
              onAction={() =>
                (window.location.href = "/movimientos/bajas/nuevo")
              }
            />
          ) : vista === 'grilla' ? (
            <div className="grid grid-cols-1 gap-4">
              {bajas.map((baja) => (
                <MovimientoCard
                  key={baja.id}
                  id={baja.id}
                  estado={baja.estado}
                  titulo={`${baja.cantidad} x ${baja.variante_nombre} ${baja.variante_especifica ? `(${baja.variante_especifica})` : ''
                    }`}
                  subtitulo={baja.observaciones}
                  customIcon={Trash2}
                  badges={[
                    { label: getMotivoLabel(baja.motivo), className: 'bg-amber-100 text-amber-700' }
                  ]}
                  info={[
                    { icon: Calendar, label: new Date(baja.fecha).toLocaleDateString() },
                    { icon: Clock, label: baja.deposito_nombre },
                    { icon: User, label: baja.usuario_nombre },
                    { icon: Tag, label: `SKU: ${baja.variante_codigo || 'S/N'}` },
                    { icon: Hash, label: `Lote: ${baja.lote_codigo || 'S/L'}` }
                  ]}
                  onApprove={handleAprobar}
                  onReject={handleRechazar}
                  onEditHref={`/movimientos/bajas/${baja.id}`}
                  isAprobando={isAprobando}
                  isRechazando={isRechazando}
                  approveLabel="Aprobar"
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      <th className="py-4 px-6">ID</th>
                      <th className="py-4 px-4">Estado</th>
                      <th className="py-4 px-4">Producto / Variante</th>
                      <th className="py-4 px-4">Motivo</th>
                      <th className="py-4 px-4">Fecha</th>
                      <th className="py-4 px-4">Depósito</th>
                      <th className="py-4 px-4 text-center">Cant.</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {bajas.map((baja) => {
                      const badgeVariant = baja.estado === 'APROBADO' ? 'success'
                        : baja.estado === 'RECHAZADO' ? 'danger'
                          : 'warning';

                      return (
                        <tr
                          key={baja.id}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/movimientos/bajas/${baja.id}/detalle`)}
                        >
                          <td className="py-4 px-6">
                            <Text variant="bodyXs" className="text-slate-400 font-bold">#{baja.id}</Text>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={badgeVariant}>
                              {baja.estado}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            <div className="flex flex-col">
                              <Text variant="bodySmBold" className="group-hover:text-blue-600 transition-colors">{baja.variante_nombre}</Text>
                              <Text variant="bodyXs" className="text-slate-400">SKU: {baja.variante_codigo || 'S/N'}</Text>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="warning">
                              {getMotivoLabel(baja.motivo)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Text variant="bodyXs" className="text-slate-500">
                              {new Date(baja.fecha).toLocaleDateString()}
                            </Text>
                          </td>
                          <td className="py-4 px-4">
                            <Text variant="bodyXs" className="text-slate-500">{baja.deposito_nombre}</Text>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Text variant="bodyXsBold" className="text-slate-900">{baja.cantidad}</Text>
                          </td>
                          <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            {baja.estado === 'BORRADOR' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/movimientos/bajas/${baja.id}`}
                                  className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-100 transition-all"
                                  title="Editar"
                                >
                                  <Edit3 size={14} />
                                </Link>
                                <button
                                  onClick={(e) => handleAprobar(baja.id, e)}
                                  disabled={isAprobando || isRechazando}
                                  className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 hover:border-emerald-100 transition-all disabled:opacity-50"
                                  title="Aprobar"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleRechazar(baja.id, e)}
                                  disabled={isAprobando || isRechazando}
                                  className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-100 transition-all disabled:opacity-50"
                                  title="Rechazar"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <Text variant="label" className="uppercase tracking-wider">
                                Auditado
                              </Text>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
