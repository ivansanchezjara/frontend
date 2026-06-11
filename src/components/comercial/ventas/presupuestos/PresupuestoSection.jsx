"use client";
import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { Section, EmptyState, Modal, Button, Input, Text } from "@/components/ui";
import { useToast, useConfirm } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getPresupuestos,
  updatePresupuesto,
  enviarPresupuesto,
  aceptarPresupuesto,
  rechazarPresupuesto,
  nuevaVersionPresupuesto,
} from "@/services/apis/ventas";
import ConstructorPresupuesto from "./ConstructorPresupuesto";
import PresupuestoCard from "./PresupuestoCard";

const ETAPAS_CON_PRESUPUESTO = ["negociacion", "ganada", "perdida"];

/**
 * Orquestador principal de presupuestos en una oportunidad.
 * Renderiza el constructor (en negociación) y el historial de versiones.
 */
export default function PresupuestoSection({ oportunidadId, etapa, tierPrecio = "publico", productosInteres = [], onGanada }) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { data: presupuestosData, loading, execute: fetchPresupuestos } =
    useApi(getPresupuestos);
  const [actionLoading, setActionLoading] = useState(null);

  // ─── Modal de rechazo ─────────────────────────────────────────
  const [rechazoModal, setRechazoModal] = useState({ open: false, id: null });
  const [rechazoMotivo, setRechazoMotivo] = useState("");

  useEffect(() => {
    if (oportunidadId) {
      fetchPresupuestos({ oportunidad: oportunidadId });
    }
  }, [oportunidadId, fetchPresupuestos]);

  const presupuestos = presupuestosData?.results || [];

  // ─── Acciones ───────────────────────────────────────────────

  const handleEnviar = async (id) => {
    setActionLoading(`enviar-${id}`);
    try {
      await enviarPresupuesto(id);
      showToast("Presupuesto enviado al cliente", "success");
      fetchPresupuestos({ oportunidad: oportunidadId });
    } catch (err) {
      showToast(err?.data?.detail || "Error al enviar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAceptar = async (id) => {
    const ok = await confirm(
      "¿Confirmar aceptación? Se generará una Venta en borrador automáticamente.",
      "Aceptar presupuesto",
      { confirmText: "Aceptar y generar venta", type: "success" }
    );
    if (!ok) return;

    setActionLoading(`aceptar-${id}`);
    try {
      await aceptarPresupuesto(id);
      showToast("Presupuesto aceptado — venta generada", "success");
      fetchPresupuestos({ oportunidad: oportunidadId });
      onGanada?.();
    } catch (err) {
      showToast(err?.data?.detail || "Error al aceptar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazarClick = useCallback((id) => {
    setRechazoMotivo("");
    setRechazoModal({ open: true, id });
  }, []);

  const handleRechazarConfirm = async () => {
    const { id } = rechazoModal;
    setRechazoModal({ open: false, id: null });
    setActionLoading(`rechazar-${id}`);
    try {
      await rechazarPresupuesto(id, { motivo: rechazoMotivo });
      showToast("Presupuesto rechazado", "warning");
      fetchPresupuestos({ oportunidad: oportunidadId });
    } catch (err) {
      showToast(err?.data?.detail || "Error al rechazar", "error");
    } finally {
      setActionLoading(null);
      setRechazoMotivo("");
    }
  };

  const handleNuevaVersion = async (id) => {
    setActionLoading(`version-${id}`);
    try {
      await nuevaVersionPresupuesto(id);
      showToast("Nueva versión creada en borrador", "success");
      fetchPresupuestos({ oportunidad: oportunidadId });
    } catch (err) {
      showToast(err?.data?.detail || "Error al crear versión", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEliminar = async (id) => {
    const ok = await confirm(
      "¿Eliminar este presupuesto borrador? Esta acción no se puede deshacer.",
      "Eliminar presupuesto",
      { confirmText: "Eliminar", type: "danger" }
    );
    if (!ok) return;

    setActionLoading(`eliminar-${id}`);
    try {
      await updatePresupuesto(id, { _method: "DELETE" });
      showToast("Presupuesto eliminado", "info");
      fetchPresupuestos({ oportunidad: oportunidadId });
    } catch {
      showToast("Error al eliminar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Render guards ──────────────────────────────────────────

  if (!ETAPAS_CON_PRESUPUESTO.includes(etapa)) return null;

  const borradorActivo = presupuestos.find((p) => p.estado === "borrador");
  const presupuestosHistoricos = presupuestos.filter((p) => p.estado !== "borrador");

  return (
    <>
      {/* Constructor (solo en negociación) */}
      {etapa === "negociacion" && (
        <ConstructorPresupuesto
          oportunidadId={oportunidadId}
          presupuestoBorrador={borradorActivo}
          tierPrecio={tierPrecio}
          productosInteres={productosInteres}
          onCreated={() => fetchPresupuestos({ oportunidad: oportunidadId })}
          onEnviar={handleEnviar}
          onEliminar={handleEliminar}
        />
      )}

      {/* Historial */}
      {presupuestosHistoricos.length > 0 && (
        <Section
          title="Historial de Presupuestos"
          subtitle={`${presupuestosHistoricos.length} versión${presupuestosHistoricos.length !== 1 ? "es" : ""} registrada${presupuestosHistoricos.length !== 1 ? "s" : ""}`}
        >
          <div className="p-5 space-y-4">
            {presupuestosHistoricos.map((presupuesto) => (
              <PresupuestoCard
                key={presupuesto.id}
                presupuesto={presupuesto}
                actionLoading={actionLoading}
                onEnviar={handleEnviar}
                onAceptar={handleAceptar}
                onRechazar={handleRechazarClick}
                onNuevaVersion={handleNuevaVersion}
                etapaActual={etapa}
              />
            ))}
          </div>
        </Section>
      )}

      {/* En etapas cerradas sin historial filtrado */}
      {etapa !== "negociacion" && presupuestos.length > 0 && presupuestosHistoricos.length === 0 && (
        <Section
          title="Presupuestos"
          subtitle={`${presupuestos.length} versión${presupuestos.length !== 1 ? "es" : ""}`}
        >
          <div className="p-5 space-y-4">
            {presupuestos.map((presupuesto) => (
              <PresupuestoCard
                key={presupuesto.id}
                presupuesto={presupuesto}
                actionLoading={actionLoading}
                onEnviar={handleEnviar}
                onAceptar={handleAceptar}
                onRechazar={handleRechazarClick}
                onNuevaVersion={handleNuevaVersion}
                etapaActual={etapa}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Estado vacío */}
      {etapa !== "negociacion" && presupuestos.length === 0 && !loading && (
        <Section title="Presupuestos">
          <div className="p-8">
            <EmptyState
              titulo="Sin presupuestos"
              descripcion="No hay presupuestos asociados a esta oportunidad."
            />
          </div>
        </Section>
      )}

      {/* Modal de rechazo */}
      <Modal
        open={rechazoModal.open}
        onClose={() => setRechazoModal({ open: false, id: null })}
        title="Rechazar presupuesto"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <Text variant="bodySm" className="text-slate-600">
            ¿Estás seguro de rechazar este presupuesto? Podés indicar un motivo opcionalmente.
          </Text>
          <div className="space-y-1.5">
            <Text as="label" variant="label" className="text-slate-500">
              Motivo (opcional)
            </Text>
            <textarea
              value={rechazoMotivo}
              onChange={(e) => setRechazoMotivo(e.target.value)}
              placeholder="Ej: Precio muy alto, cliente eligió otra opción..."
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRechazoModal({ open: false, id: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={X}
              onClick={handleRechazarConfirm}
            >
              Rechazar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
