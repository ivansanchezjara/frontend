"use client";
import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { Section, EmptyState, Modal, Button, Text } from "@/components/ui";
import { useToast, useConfirm } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getPresupuestos,
  updatePresupuesto,
  enviarPresupuesto,
  aceptarPresupuesto,
  rechazarPresupuesto,
} from "@/services/apis/ventas";
import PresupuestoSummaryCard from "./PresupuestoSummaryCard";

const ETAPAS_CON_PRESUPUESTO = ["negociacion", "ganada", "perdida"];

/**
 * Sección de presupuestos en la vista de oportunidad.
 * Muestra tarjetas resumen (PresupuestoSummaryCard) en lugar del constructor embebido.
 * Incluye acciones rápidas (enviar, eliminar, aceptar, rechazar) y estado vacío
 * con botón "Crear presupuesto" que navega a la página dedicada.
 */
export default function PresupuestoSection({ oportunidadId, etapa, onGanada }) {
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

  // ─── Render guards ──────────────────────────────────────────

  if (!ETAPAS_CON_PRESUPUESTO.includes(etapa)) return null;

  return (
    <>
      <Section
        title="Presupuestos"
        subtitle={
          presupuestos.length > 0
            ? `${presupuestos.length} presupuesto${presupuestos.length !== 1 ? "s" : ""}`
            : undefined
        }
      >
        <div className="p-5 space-y-4">
          {/* Lista de tarjetas resumen */}
          {presupuestos.length > 0 ? (
            presupuestos.map((presupuesto) => (
              <PresupuestoSummaryCard
                key={presupuesto.id}
                presupuesto={presupuesto}
                onEnviar={handleEnviar}
                onEliminar={handleEliminar}
                onAceptar={handleAceptar}
                onRechazar={handleRechazarClick}
              />
            ))
          ) : (
            /* Estado vacío: mostrar "Crear presupuesto" en negociación */
            etapa === "negociacion" ? (
              <PresupuestoSummaryCard
                empty
                oportunidadId={oportunidadId}
              />
            ) : (
              <EmptyState
                titulo="Sin presupuestos"
                descripcion="No hay presupuestos asociados a esta oportunidad."
              />
            )
          )}
        </div>
      </Section>

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
