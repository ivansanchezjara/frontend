"use client";
import { EmptyState, LoadingScreen, PageHeader, Heading, Text, Button, Badge } from '@/components/ui';
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings2,
  User,
  Calendar,
  Plus,
  Package,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getAjustes, aprobarAjuste } from "@/services/apis/movimientos";
import AjusteDetailModal from "@/components/movimientos/AjusteDetailModal";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function AjustesInventarioPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [selectedAjuste, setSelectedAjuste] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --- API & DATA ---
  const {
    data: ajustesData,
    loading,
    refresh: fetchAjustes
  } = useApi(getAjustes, { auto: true, initialData: [] });

  const ajustes = ajustesData?.results || ajustesData || [];

  const { execute: executeAprobar } = useApi(aprobarAjuste);

  // RESTAURAMOS LA FUNCIÓN DE APROBACIÓN
  const handleAprobar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    const isConfirmed = await confirm(
      "¿Confirmar aprobación de este ajuste de inventario? El stock físico, lotes y vencimientos se actualizarán inmediatamente.",
      "Aprobar Ajuste"
    );

    if (!isConfirmed) return;

    try {
      await executeAprobar(id);
      showToast("Ajuste aprobado con éxito", "success");
      fetchAjustes(); // Recargamos la lista para ver el cambio de estado
    } catch (error) {
      showToast("Error al aprobar el ajuste", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión de Movimientos", href: "/movimientos" },
          { label: "Ajustes de Inventario" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            <span>
              Corregir discrepancias de stock, lotes y fechas de vencimiento de
              forma auditada.
            </span>
          </>
        }
      >
        <Link
          href="/movimientos/ajustes/nuevo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
        >
          <Plus size={16} /> Registrar Ajuste
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {loading ? (
            <LoadingScreen message="Cargando historial de ajustes de inventario..." />
          ) : ajustes.length === 0 ? (
            <EmptyState
              icon={
                <Settings2 size={48} className="text-slate-300 mx-auto mb-4" />
              }
              title="No hay ajustes de inventario"
              message="Aquí verás el historial de todas las correcciones de stock, lotes y vencimientos."
              actionLabel="Nuevo Ajuste"
              onAction={() => router.push("/movimientos/ajustes/nuevo")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {ajustes.map((ajuste) => (
                <div
                  key={ajuste.id}
                  onClick={() => {
                    setSelectedAjuste(ajuste);
                    setIsDetailModalOpen(true);
                  }}
                  className={`bg-white p-6 rounded-[32px] border shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row items-center gap-6 cursor-pointer active:scale-[0.99] ${ajuste.estado === "BORRADOR" ? "border-amber-200 hover:border-amber-400" : "border-slate-200 hover:border-blue-200"}`}
                >
                  {/* Icono de Estado */}
                  <div
                    className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm border ${ajuste.estado === "APROBADO" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100"}`}
                  >
                    {ajuste.estado === "APROBADO" ? (
                      <CheckCircle size={32} />
                    ) : (
                      <Clock size={32} />
                    )}
                  </div>

                  {/* Info Principal */}
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <Text variant="label" className="uppercase tracking-widest">ID #{ajuste.id}</Text>

                      <Badge variant={ajuste.estado === "APROBADO" ? "success" : "warning"} className="uppercase tracking-widest">
                        {ajuste.estado || "BORRADOR"}
                      </Badge>

                      <Badge variant="default" className="uppercase tracking-widest">
                        {ajuste.motivo?.replace("_", " ") || "AJUSTE"}
                      </Badge>
                    </div>

                    <Heading level={3} className="text-xl text-slate-900 truncate tracking-tight">
                      {ajuste.variante_nombre || "Producto Ajustado"}
                    </Heading>

                    {ajuste.observaciones && (
                      <Text variant="bodySm" className="text-slate-500 font-medium mt-1 truncate">
                        "{ajuste.observaciones}"
                      </Text>
                    )}

                    {ajuste.lotes_ajustados?.length > 0 && (
                      <div className="mt-4 text-slate-500 text-sm space-y-1">
                        <Text variant="label" className="uppercase tracking-[0.3em]">Lotes modificados</Text>
                        {ajuste.lotes_ajustados.slice(0, 2).map((item) => (
                          <Text key={item.id} variant="bodyXs" className="truncate">
                            <Text variant="bodyXsBold" className="font-black text-slate-700">
                              {item.lote_codigo}
                            </Text>
                            : {item.cantidad_anterior}u →{" "}
                            {item.nueva_cantidad ?? item.cantidad_anterior}u
                            {item.nuevo_vencimiento ? (
                              <Text variant="bodyXs" className="text-slate-400">
                                {" "} | Vence {item.vencimiento_anterior ||
                                  "N/A"} → {item.nuevo_vencimiento}
                              </Text>
                            ) : null}
                          </Text>
                        ))}
                        {ajuste.lotes_ajustados.length > 2 && (
                          <Text variant="bodyXs" className="text-slate-400">
                            + {ajuste.lotes_ajustados.length - 2} lote(s) más
                          </Text>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      <Text variant="bodyXs" className="flex items-center gap-2">
                        <Calendar size={14} />{" "}
                        {new Date(
                          ajuste.fecha || ajuste.creado_en,
                        ).toLocaleDateString()}
                      </Text>
                      <Text variant="bodyXs" className="flex items-center gap-2">
                        <User size={14} /> {ajuste.usuario_nombre || "Usuario"}
                      </Text>
                    </div>
                  </div>

                  {/* Botón de Acción (Solo si es Borrador) */}
                  <div className="flex items-center gap-3">
                    {(ajuste.estado === "BORRADOR" || !ajuste.estado) && (
                      <Button
                        onClick={(e) => handleAprobar(ajuste.id, e)}
                        className="bg-slate-900 hover:bg-amber-500 text-white hover:text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:shadow-amber-200 transition-all border-none"
                      >
                        Aprobar Ajuste
                      </Button>
                    )}
                    {ajuste.estado === "APROBADO" && (
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                        <CheckCircle size={14} /> Stock Actualizado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <AjusteDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAjuste(null);
          }}
          ajuste={selectedAjuste}
        />
      </main>
    </div>
  );
}
