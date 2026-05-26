"use client";
import { EmptyState, LoadingScreen, PageHeader, Pagination } from '@/components/ui';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shuffle,
  User,
  Calendar,
  Plus,
  Package,
  CheckCircle,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getAjustes, aprobarAjuste } from "@/services/apis/movimientos";
import MovimientosFilterBar from "@/components/movimientos/MovimientosFilterBar";
import MovimientoCard from "@/components/movimientos/MovimientoCard";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function ReclasificarPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
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

  // --- API & DATA ---
  const {
    data: ajustesData,
    loading,
    execute: fetchAjustes
  } = useApi(getAjustes, { auto: false, initialData: { results: [], count: 0 } });

  useEffect(() => {
    fetchAjustes({
      page,
      search: debouncedSearch,
      ...filters
    });
  }, [page, debouncedSearch, filters, fetchAjustes]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const ajustes = ajustesData?.results || [];
  const totalCount = ajustesData?.count || 0;

  const { execute: executeAprobar } = useApi(aprobarAjuste);

  const handleAprobar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    const isConfirmed = await confirm(
      "¿Confirmar aprobación? Las cantidades se moverán entre lotes inmediatamente.",
      "Aprobar Reclasificación"
    );

    if (!isConfirmed) return;

    try {
      await executeAprobar(id);
      showToast("Reclasificación aprobada con éxito", "success");
      fetchAjustes({ page, search: debouncedSearch, ...filters });
    } catch (error) {
      showToast("Error al aprobar la reclasificación", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión de Movimientos", href: "/movimientos" },
          { label: "Reclasificar Inventario" },
        ]}
        subtitle={
          <>
            <Shuffle size={12} />
            Mover unidades de un lote a otro de forma auditada.
          </>
        }
      >
        <Link
          href="/movimientos/ajustes/reclasificar/nuevo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
        >
          <Plus size={16} /> Nueva Reclasificación
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <MovimientosFilterBar
            searchTerm={searchTerm}
            setSearchTerm={(val) => { setSearchTerm(val); setPage(1); }}
            filters={filters}
            handleFilterChange={handleFilterChange}
            onClear={() => {
              setSearchTerm('');
              setFilters({ fecha_inicio: '', fecha_fin: '', estado: '' });
              setPage(1);
            }}
            loading={loading}
            placeholder="Buscar por producto, observaciones o ID..."
            estadoOptions={[
              { value: "BORRADOR", label: "Borrador" },
              { value: "APROBADO", label: "Aprobado" },
            ]}
          />

          {loading ? (
            <LoadingScreen message="Cargando reclasificaciones..." />
          ) : ajustes.length === 0 ? (
            <EmptyState
              icon={
                <Shuffle size={48} className="text-slate-300 mx-auto mb-4" />
              }
              title="No hay reclasificaciones"
              message="Aquí verás el historial de movimientos de stock entre lotes."
              actionLabel="Nueva Reclasificación"
              onAction={() => router.push("/movimientos/ajustes/reclasificar/nuevo")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {ajustes.map((ajuste) => (
                <MovimientoCard
                  key={ajuste.id}
                  id={ajuste.id}
                  estado={ajuste.estado || "BORRADOR"}
                  titulo={ajuste.producto_nombre || ajuste.variante_nombre || "Producto"}
                  subtitulo={ajuste.observaciones}
                  customIcon={ajuste.estado !== 'APROBADO' ? Shuffle : undefined}
                  badges={[
                    { label: ajuste.motivo || "RECLASIFICACIÓN", className: 'bg-slate-100 text-slate-500' },
                    ...(ajuste.items?.length > 0 ? [{ label: `${ajuste.items.length} movimiento(s)`, className: 'bg-blue-50 text-blue-600' }] : [])
                  ]}
                  info={[
                    { icon: Calendar, label: new Date(ajuste.fecha).toLocaleDateString() },
                    { icon: User, label: `Creado: ${ajuste.usuario_nombre || '—'}` },
                    ...(ajuste.aprobado_por_nombre ? [{ icon: CheckCircle, label: `Aprobado: ${ajuste.aprobado_por_nombre}` }] : []),
                    ...(ajuste.items?.length > 0 ? [{ icon: Package, label: `${ajuste.items.length} lote(s) afectados` }] : [])
                  ]}
                  onClick={() => {
                    router.push(`/movimientos/ajustes/reclasificar/${ajuste.id}`);
                  }}
                  onApprove={handleAprobar}
                  isAprobando={false}
                  approveLabel="Aprobar"
                />
              ))}
            </div>
          )}

          {!loading && totalCount > PAGE_SIZE && (
            <Pagination
              currentPage={page}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </div>
      </main>
    </div>
  );
}
