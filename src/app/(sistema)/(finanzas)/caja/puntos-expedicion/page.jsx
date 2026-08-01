"use client";
import { useState, useEffect } from "react";
import {
  PageHeader,
  Badge,
  Button,
  LoadingScreen,
  EmptyState,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getPuntosExpedicion, getTimbrados } from "@/services/apis/caja";
import PuntoExpedicionForm from "@/components/caja/PuntoExpedicionForm";
import { MapPin, Plus, Pencil, X, Info, FileText } from "lucide-react";

export default function PuntosExpedicionPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPunto, setEditingPunto] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const {
    data: puntosData,
    loading,
    execute: fetchPuntos,
  } = useApi(getPuntosExpedicion, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  // Traer timbrados para mostrar cuántos tiene cada punto
  const { data: timbradosData, execute: fetchTimbrados } = useApi(getTimbrados, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const puntos = puntosData?.results || [];
  const timbrados = timbradosData?.results || [];

  useEffect(() => {
    fetchPuntos({ page_size: 100 });
    fetchTimbrados({ page_size: 200, activo: true });
  }, [fetchPuntos, fetchTimbrados]);

  // Contar timbrados activos por punto
  const timbradosPorPunto = (puntoId) =>
    timbrados.filter((t) => t.punto_expedicion?.id === puntoId).length;

  const handleNuevo = () => {
    setEditingPunto(null);
    setShowForm(true);
  };

  const handleEditar = (punto) => {
    setEditingPunto(punto);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPunto(null);
    fetchPuntos({ page_size: 100 });
    fetchTimbrados({ page_size: 200, activo: true });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPunto(null);
  };

  // Separar activos e inactivos
  const puntosActivos = puntos.filter((p) => p.activo);
  const puntosInactivos = puntos.filter((p) => !p.activo);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Puntos de Expedición" },
        ]}
        subtitle={
          <>
            <MapPin size={12} /> Establecimientos y puntos de emisión
          </>
        }
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-colors"
            title="¿Qué es esto?"
          >
            <Info size={18} />
          </button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleNuevo}
            className="rounded-xl font-bold text-xs shadow-lg shadow-purple-100 cursor-pointer"
          >
            Nuevo Punto
          </Button>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Info card colapsable */}
          {showInfo && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs text-purple-700">
                <strong>¿Qué es un punto de expedición?</strong> Es la combinación
                de establecimiento (sucursal) + punto de emisión (caja/terminal) que
                exige la SET para numerar facturas. El formato es{" "}
                <code className="bg-purple-100 px-1 rounded">EST-PTO-NÚMERO</code>,
                por ejemplo{" "}
                <code className="bg-purple-100 px-1 rounded">001-001-0000001</code>.
                Si tu empresa tiene un solo local con una sola caja, solo necesitás
                un punto (<code className="bg-purple-100 px-1 rounded">001-001</code>).
              </p>
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <LoadingScreen message="Cargando puntos de expedición..." />
          ) : puntos.length === 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-xs text-purple-700">
                  <strong>¿Qué es un punto de expedición?</strong> Es la combinación
                  de establecimiento (sucursal) + punto de emisión (caja/terminal)
                  según la SET. Necesitás al menos uno para poder cobrar pedidos y
                  emitir comprobantes.
                </p>
              </div>
              <EmptyState
                icon="📍"
                title="No hay puntos de expedición"
                description="Creá al menos un punto de expedición para poder emitir comprobantes y facturas."
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Puntos activos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {puntosActivos.map((punto) => {
                  const cantTimbrados = timbradosPorPunto(punto.id);
                  return (
                    <div
                      key={punto.id}
                      className="relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group"
                    >
                      {/* Badge de estado */}
                      <div className="absolute top-4 right-4">
                        <Badge variant="success">Activo</Badge>
                      </div>

                      {/* Código grande */}
                      <p className="text-2xl font-black text-slate-800 mb-1">
                        {punto.codigo_completo}
                      </p>

                      {/* Nombre */}
                      <p className="text-sm text-slate-500 mb-3">
                        {punto.nombre}
                      </p>

                      {/* Info timbrados */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <FileText size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-400">
                          {cantTimbrados === 0 ? (
                            <span className="text-amber-600 font-semibold">
                              Sin timbrado activo
                            </span>
                          ) : (
                            `${cantTimbrados} timbrado${cantTimbrados > 1 ? "s" : ""} activo${cantTimbrados > 1 ? "s" : ""}`
                          )}
                        </span>
                      </div>

                      {/* Botón editar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Pencil}
                        onClick={() => handleEditar(punto)}
                        className="text-slate-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Editar
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Puntos inactivos */}
              {puntosInactivos.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Inactivos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {puntosInactivos.map((punto) => (
                      <div
                        key={punto.id}
                        className="relative p-5 rounded-2xl bg-slate-50 border border-slate-200 border-dashed opacity-70 hover:opacity-100 hover:border-slate-300 transition-all group"
                      >
                        {/* Badge */}
                        <div className="absolute top-4 right-4">
                          <Badge variant="default">Inactivo</Badge>
                        </div>

                        {/* Código */}
                        <p className="text-2xl font-black text-slate-400 mb-1">
                          {punto.codigo_completo}
                        </p>

                        {/* Nombre */}
                        <p className="text-sm text-slate-400 mb-4">
                          {punto.nombre}
                        </p>

                        {/* Botón editar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          onClick={() => handleEditar(punto)}
                          className="text-slate-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Reactivar / Editar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal para formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleFormClose}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingPunto ? "Editar Punto de Expedición" : "Nuevo Punto de Expedición"}
              </h2>
              <button
                onClick={handleFormClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <PuntoExpedicionForm
              punto={editingPunto}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
