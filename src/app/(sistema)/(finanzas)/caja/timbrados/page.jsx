"use client";
import { useState, useEffect } from "react";
import {
  PageHeader,
  Badge,
  Button,
  Pagination,
  LoadingScreen,
  EmptyState,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getTimbrados } from "@/services/apis/caja";
import TimbradoForm from "@/components/caja/TimbradoForm";
import { Stamp, Plus, Pencil, AlertTriangle, X } from "lucide-react";

const PAGE_SIZE = 24;

export default function TimbradosPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingTimbrado, setEditingTimbrado] = useState(null);

  const {
    data: timbradosData,
    loading,
    execute: fetchTimbrados,
  } = useApi(getTimbrados, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const timbrados = timbradosData?.results || [];
  const count = timbradosData?.count || 0;

  useEffect(() => {
    fetchTimbrados({ page });
  }, [page, fetchTimbrados]);

  const handleNuevo = () => {
    setEditingTimbrado(null);
    setShowForm(true);
  };

  const handleEditar = (timbrado) => {
    setEditingTimbrado(timbrado);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTimbrado(null);
    fetchTimbrados({ page });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTimbrado(null);
  };

  // ─── Helpers ──────────────────────────────────────────────────

  function getEstadoBadge(timbrado) {
    if (!timbrado.activo) {
      return <Badge variant="default">Inactivo</Badge>;
    }

    const hoy = new Date().toISOString().split("T")[0];
    if (timbrado.fecha_fin_vigencia < hoy) {
      return <Badge variant="danger">Vencido</Badge>;
    }

    // Alerta si vence en 30 días o menos
    const treintaDias = new Date();
    treintaDias.setDate(treintaDias.getDate() + 30);
    const limiteStr = treintaDias.toISOString().split("T")[0];
    if (timbrado.fecha_fin_vigencia <= limiteStr) {
      return <Badge variant="warning">Por vencer</Badge>;
    }

    return <Badge variant="success">Activo</Badge>;
  }

  function getAlertaBadge(timbrado) {
    if (timbrado.esta_agotado) {
      return (
        <Badge variant="danger" className="flex items-center gap-1">
          <AlertTriangle size={10} />
          Agotado
        </Badge>
      );
    }
    if (timbrado.esta_por_agotarse) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle size={10} />
          Por agotarse
        </Badge>
      );
    }
    return null;
  }

  function formatTipoDocumento(tipo) {
    const tipos = {
      factura: "Factura",
      nota_credito: "Nota de Crédito",
    };
    return tipos[tipo] || tipo;
  }

  function formatFecha(fecha) {
    if (!fecha) return "—";
    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
  }

  /** Calcula el porcentaje de uso del rango de números */
  function getPorcentajeUso(timbrado) {
    const total = timbrado.numero_final - timbrado.numero_inicial + 1;
    if (total <= 0) return 0;
    const usado = (timbrado.ultimo_numero_usado || timbrado.numero_inicial - 1) - timbrado.numero_inicial + 1;
    return Math.min(Math.max((usado / total) * 100, 0), 100);
  }

  function getBarColor(porcentaje, timbrado) {
    if (timbrado.esta_agotado) return "bg-red-500";
    if (porcentaje >= 90 || timbrado.esta_por_agotarse) return "bg-amber-500";
    return "bg-purple-500";
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Timbrados" },
        ]}
        subtitle={
          <>
            <Stamp size={12} /> Gestión de timbrados autorizados por la SET
          </>
        }
      >
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={handleNuevo}
          className="rounded-xl font-bold text-xs shadow-lg shadow-purple-100 cursor-pointer"
        >
          Nuevo Timbrado
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Contenido */}
          {loading ? (
            <LoadingScreen message="Cargando timbrados..." />
          ) : timbrados.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No hay timbrados registrados"
              description="Creá un nuevo timbrado para comenzar a emitir facturas."
            />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500">
                        <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">
                          Nro. Timbrado
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                          Punto Expedición
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                          Tipo
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                          Vigencia
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest min-w-[180px]">
                          Uso del Rango
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                          Estado
                        </th>
                        <th className="py-3 pr-6 pl-4 text-[11px] font-black uppercase tracking-widest">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timbrados.map((timbrado) => {
                        const porcentaje = getPorcentajeUso(timbrado);
                        const barColor = getBarColor(porcentaje, timbrado);

                        return (
                          <tr
                            key={timbrado.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3 pl-6 pr-4">
                              <span className="font-semibold text-sm text-slate-800">
                                {timbrado.numero_timbrado}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-slate-600">
                                {timbrado.punto_expedicion?.codigo_completo || "—"}
                              </span>
                              {timbrado.punto_expedicion?.nombre && (
                                <span className="text-xs text-slate-400 ml-1.5">
                                  {timbrado.punto_expedicion.nombre}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-slate-600">
                                {formatTipoDocumento(timbrado.tipo_documento)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-slate-600">
                                {formatFecha(timbrado.fecha_inicio_vigencia)} — {formatFecha(timbrado.fecha_fin_vigencia)}
                              </span>
                            </td>
                            {/* Columna de uso con barra de progreso */}
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">
                                    {(timbrado.ultimo_numero_usado || timbrado.numero_inicial - 1).toLocaleString()} / {timbrado.numero_final.toLocaleString()}
                                  </span>
                                  <span className="font-bold text-slate-600">
                                    {Math.round(porcentaje)}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${barColor}`}
                                    style={{ width: `${porcentaje}%` }}
                                  />
                                </div>
                                {getAlertaBadge(timbrado) && (
                                  <div className="pt-0.5">
                                    {getAlertaBadge(timbrado)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {getEstadoBadge(timbrado)}
                            </td>
                            <td className="py-3 pr-6 pl-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Pencil}
                                onClick={() => handleEditar(timbrado)}
                                className="text-slate-500 hover:text-purple-600"
                              >
                                Editar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {count > PAGE_SIZE && (
                <Pagination
                  count={count}
                  pageSize={PAGE_SIZE}
                  currentPage={page}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal para formulario de timbrado */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleFormClose}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingTimbrado ? "Editar Timbrado" : "Nuevo Timbrado"}
              </h2>
              <button
                onClick={handleFormClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <TimbradoForm
              timbrado={editingTimbrado}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
