"use client";
import { EmptyState, LoadingScreen, PageHeader, Pagination, Badge, Text } from '@/components/ui';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Package,
  User,
  Calendar,
  Plus,
  Check,
  X,
  Edit3
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getTransferencias,
  aprobarTransferencia,
  rechazarTransferencia,
} from "@/services/apis/movimientos";
import MovimientoCard from "@/components/movimientos/MovimientoCard";
import MovimientosFilterBar from "@/components/movimientos/MovimientosFilterBar";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function TransferenciasPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm, danger } = useConfirm();

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

  const {
    data: transferenciasData,
    loading,
    execute: fetchTransferencias,
  } = useApi(getTransferencias, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const transferencias = transferenciasData?.results || [];
  const totalCount = transferenciasData?.count || 0;

  // Cargar datos cuando cambian los filtros o la página
  useEffect(() => {
    fetchTransferencias({
      page,
      search: debouncedSearch,
      ...filters
    });
  }, [page, debouncedSearch, filters, fetchTransferencias]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const { execute: aprobarAction, loading: isAprobando } = useApi(aprobarTransferencia, {
    auto: false,
  });

  const { execute: rechazarAction, loading: isRechazando } = useApi(rechazarTransferencia, {
    auto: false,
  });

  const handleAprobar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await confirm(
      "¿Confirmar aprobación de esta transferencia? El stock se moverá inmediatamente entre depósitos.",
      "Aprobar Transferencia"
    );
    if (!confirmed) return;

    try {
      await aprobarAction(id);
      showToast("Transferencia aprobada con éxito.", "success");
      await fetchTransferencias({ page, search: debouncedSearch, ...filters });
    } catch (error) {
      // Error handling is managed by useApi / useErrorHandler
    }
  };

  const handleRechazar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await danger(
      "¿Confirmar rechazo de esta transferencia? Esta acción es irreversible.",
      "Rechazar Transferencia"
    );
    if (!confirmed) return;

    try {
      await rechazarAction(id);
      showToast("Transferencia rechazada.", "info");
      await fetchTransferencias({ page, search: debouncedSearch, ...filters });
    } catch (error) {
      // Error handling is managed by useApi / useErrorHandler
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión de Movimientos", href: "/movimientos" },
          { label: "Transferencias Internas" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            Movilizá stock entre depósitos de forma auditada.
          </>
        }
      >
        <Link
          href="/movimientos/transferencias/nuevo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
        >
          <Plus size={16} /> Nueva Transferencia
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
            placeholder="Buscar por depósito de origen o destino..."
            vista={vista}
            setVista={setVista}
          />

          {loading ? (
            <LoadingScreen message="Sincronizando transferencias..." />
          ) : transferencias.length === 0 ? (
            <EmptyState
              icon={<ArrowRightLeft size={48} className="text-slate-300 mx-auto mb-4" />}
              title="No hay transferencias registradas"
              message="Aquí verás todos los movimientos de stock realizados entre tus depósitos."
              actionLabel="Nueva Transferencia"
              onAction={() =>
                (window.location.href = "/movimientos/transferencias/nuevo")
              }
            />
          ) : vista === 'grilla' ? (
            <div className="grid grid-cols-1 gap-4">
              {transferencias.map((transf) => (
                <MovimientoCard
                  key={transf.id}
                  id={transf.id}
                  estado={transf.estado}
                  titulo={`${transf.deposito_origen_nombre} → ${transf.deposito_destino_nombre}`}
                  subtitulo={transf.observaciones}
                  customIcon={transf.estado !== 'APROBADO' ? ArrowRightLeft : undefined}
                  badges={[
                    { label: `${transf.items?.length || 0} Ítems`, className: 'bg-slate-100 text-slate-500' }
                  ]}
                  info={[
                    { icon: Calendar, label: new Date(transf.fecha).toLocaleDateString() },
                    { icon: User, label: `Creado: ${transf.usuario_nombre || '—'}` },
                    ...(transf.aprobado_por_nombre ? [{ icon: Check, label: `Confirmado: ${transf.aprobado_por_nombre}` }] : []),
                    { icon: Package, label: `${transf.items?.length || 0} Ítems` }
                  ]}
                  onApprove={handleAprobar}
                  onReject={handleRechazar}
                  onEditHref={`/movimientos/transferencias/${transf.id}`}
                  isAprobando={isAprobando}
                  isRechazando={isRechazando}
                  approveLabel="Aprobar Movimiento"
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
                      <th className="py-4 px-4">Origen</th>
                      <th className="py-4 px-4">Destino</th>
                      <th className="py-4 px-4">Fecha</th>
                      <th className="py-4 px-4 text-center">Ítems</th>
                      <th className="py-4 px-4">Creado por</th>
                      <th className="py-4 px-4">Confirmado por</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {transferencias.map((transf) => {
                      const badgeVariant = transf.estado === 'APROBADO' ? 'success' : 'warning';

                      return (
                        <tr
                          key={transf.id}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/movimientos/transferencias/${transf.id}/detalle`)}
                        >
                          <td className="py-4 px-6">
                            <Text as="span" variant="label" className="text-slate-400 font-bold">#{transf.id}</Text>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={badgeVariant}>
                              {transf.estado}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {transf.deposito_origen_nombre}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {transf.deposito_destino_nombre}
                          </td>
                          <td className="py-4 px-4">
                            <Text as="span" variant="bodySm" className="text-slate-500">
                              {new Date(transf.fecha).toLocaleDateString()}
                            </Text>
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-slate-900">{transf.items?.length || 0}</td>
                          <td className="py-4 px-4">
                            <Text as="span" variant="bodySm" className="text-slate-500">{transf.usuario_nombre || '—'}</Text>
                          </td>
                          <td className="py-4 px-4">
                            <Text as="span" variant="bodySm" className="text-slate-500">{transf.aprobado_por_nombre || '—'}</Text>
                          </td>
                          <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            {transf.estado === 'BORRADOR' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => router.push(`/movimientos/transferencias/${transf.id}`)}
                                  className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-100 transition-all"
                                  title="Editar Borrador"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleRechazar(transf.id, e)}
                                  className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-100 transition-all"
                                  title="Rechazar"
                                >
                                  <X size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleAprobar(transf.id, e)}
                                  className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 hover:border-emerald-100 transition-all"
                                  title="Aprobar"
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            ) : (
                              <Text as="span" variant="label" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
