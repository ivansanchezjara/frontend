"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, XCircle, FileQuestion } from "lucide-react";
import { PageHeader, LoadingScreen, Button } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getPresupuesto,
  enviarPresupuesto,
  aceptarPresupuesto,
  rechazarPresupuesto,
} from "@/services/apis/ventas";
import ConstructorPresupuesto from "@/components/comercial/ventas/presupuestos/ConstructorPresupuesto";

// ─── Página dedicada de presupuesto ─────────────────────────────

export default function PresupuestoDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const {
    data: presupuesto,
    loading,
    error,
    execute: fetchPresupuesto,
  } = useApi(getPresupuesto);

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) fetchPresupuesto(id);
  }, [id, fetchPresupuesto]);

  // ─── Acciones por estado ────────────────────────────────────

  const handleEnviar = async () => {
    setActionLoading(true);
    try {
      await enviarPresupuesto(id);
      showToast("Presupuesto enviado al cliente", "success");
      fetchPresupuesto(id);
    } catch (err) {
      showToast("Error al enviar presupuesto", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAceptar = async () => {
    setActionLoading(true);
    try {
      await aceptarPresupuesto(id);
      showToast("Presupuesto aceptado", "success");
      fetchPresupuesto(id);
    } catch (err) {
      showToast("Error al aceptar presupuesto", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRechazar = async () => {
    setActionLoading(true);
    try {
      await rechazarPresupuesto(id);
      showToast("Presupuesto rechazado", "success");
      fetchPresupuesto(id);
    } catch (err) {
      showToast("Error al rechazar presupuesto", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────

  if (loading && !presupuesto) {
    return <LoadingScreen texto="Cargando presupuesto..." />;
  }

  // ─── 404 — Presupuesto no encontrado ───────────────────────

  if (!loading && !presupuesto) {
    return (
      <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
        <PageHeader
          breadcrumbs={[
            { label: "Presupuestos", href: "/ventas-crm/presupuestos" },
            { label: "No encontrado" },
          ]}
        />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <FileQuestion className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-lg font-bold text-slate-700">
              Presupuesto no encontrado
            </h2>
            <p className="text-sm text-slate-500">
              El presupuesto que buscás no existe o fue eliminado.
            </p>
            <Link
              href="/ventas-crm/presupuestos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Volver al listado de presupuestos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ─── Datos derivados ────────────────────────────────────────

  const esBorrador = presupuesto.estado === "borrador";
  const esEnviado = presupuesto.estado === "enviado";
  const esPipeline = presupuesto.tipo === "pipeline";
  const readOnly = !esBorrador;

  const backLink = esPipeline
    ? { href: `/ventas-crm/oportunidades/${presupuesto.oportunidad}`, label: "← Volver a oportunidad" }
    : { href: "/ventas-crm/presupuestos", label: "← Volver al listado" };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Presupuestos", href: "/ventas-crm/presupuestos" },
          { label: presupuesto.cliente_razon_social },
          { label: `v${presupuesto.version}` },
        ]}
        subtitle={`Estado: ${presupuesto.estado}`}
        subtitleClassName="text-emerald-600"
      >
        {/* Botones de acción según estado */}
        {esBorrador && (
          <Button
            variant="success"
            size="sm"
            icon={Send}
            onClick={handleEnviar}
            disabled={actionLoading}
          >
            Enviar al cliente
          </Button>
        )}
        {esEnviado && (
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle}
              onClick={handleAceptar}
              disabled={actionLoading}
            >
              Aceptar
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={handleRechazar}
              disabled={actionLoading}
            >
              Rechazar
            </Button>
          </div>
        )}
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Back link contextual */}
          <Link
            href={backLink.href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            {backLink.label}
          </Link>

          {/* Constructor de presupuesto */}
          {readOnly ? (
            <div className="pointer-events-none opacity-90">
              <ConstructorPresupuesto
                oportunidadId={presupuesto.oportunidad}
                presupuestoBorrador={presupuesto}
                tierPrecio={presupuesto.cliente_tier_precio || "publico"}
                productosInteres={[]}
              />
            </div>
          ) : (
            <ConstructorPresupuesto
              oportunidadId={presupuesto.oportunidad}
              presupuestoBorrador={presupuesto}
              tierPrecio={presupuesto.cliente_tier_precio || "publico"}
              productosInteres={[]}
              onEnviar={handleEnviar}
            />
          )}
        </div>
      </main>
    </div>
  );
}
