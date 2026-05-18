"use client";
import Link from "next/link";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import {
  ArrowRightLeft,
  Package,
  User,
  Calendar,
  Plus,
  CheckCircle,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import {
  getTransferencias,
  aprobarTransferencia,
} from "@/services/apis/movimientos";
import MovimientoCard from "@/components/movimientos/MovimientoCard";
import MovimientosFilterBar from "@/components/movimientos/MovimientosFilterBar";
import Pagination from "@/components/ui/Pagination";

export default function TransferenciasPage() {
  const {
    data: transferenciasData,
    loading,
    execute: fetchTransferencias,
  } = useApi(getTransferencias, {
    auto: true,
    initialData: { results: [] },
  });

  const transferencias = transferenciasData?.results || [];

  const { execute: aprobarAction } = useApi(aprobarTransferencia, {
    auto: false,
  });

  const handleAprobar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        "¿Confirmar aprobación de esta transferencia? El stock se moverá inmediatamente entre depósitos.",
      )
    )
      return;

    try {
      await aprobarAction(id);
      await fetchTransferencias();
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
            <span>Movilizá stock entre depósitos de forma auditada.</span>
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
          {loading ? (
            <LoadingScreen message="Sincronizando transferencias..." />
          ) : transferencias.length === 0 ? (
            <EmptyState
              icon="🔄"
              title="No hay transferencias registradas"
              message="Aquí verás todos los movimientos de stock realizados entre tus depósitos."
              actionLabel="Nueva Transferencia"
              onAction={() =>
                (window.location.href = "/movimientos/transferencias/nuevo")
              }
            />
          ) : (
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
                    { icon: User, label: transf.usuario_nombre },
                    { icon: Package, label: `${transf.items?.length || 0} Ítems` }
                  ]}
                  onApprove={handleAprobar}
                  approveLabel="Aprobar Movimiento"
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
