"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileQuestion, Copy, Download, Pencil, Trash2,
  CheckCircle, XCircle, ArrowLeft,
} from "lucide-react";
import { PageHeader, LoadingScreen, Button, Badge, Text, Section } from "@/components/ui";
import { useToast, useConfirm } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getPresupuesto,
  deletePresupuesto,
  enviarPresupuesto,
  aceptarPresupuesto,
  rechazarPresupuesto,
  revertirBorradorPresupuesto,
  getTextoPresupuesto,
  descargarPdfPresupuesto,
} from "@/services/apis/ventas";
import ConstructorPresupuesto from "@/components/comercial/ventas/presupuestos/ConstructorPresupuesto";
import { formatMonto, formatFecha } from "@/components/comercial/ventas/presupuestos/presupuesto-utils";

// ─── Badge config ───────────────────────────────────────────────

const ESTADO_BADGE = {
  borrador: { variant: "warning", label: "Borrador" },
  enviado: { variant: "info", label: "Enviado" },
  aceptado: { variant: "success", label: "Aceptado" },
  rechazado: { variant: "danger", label: "Rechazado" },
  vencido: { variant: "default", label: "Vencido" },
};

// ─── Vista de solo lectura (tabla limpia) ───────────────────────

function PresupuestoReadOnly({ presupuesto }) {
  const lineas = presupuesto.lineas || [];

  return (
    <Section
      title={presupuesto.codigo}
      subtitle={`Creado ${formatFecha(presupuesto.created_at)}${presupuesto.enviado_at ? ` · Enviado ${formatFecha(presupuesto.enviado_at)}` : ""}`}
    >
      <div className="p-5 space-y-4">
        {/* Info general */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span>
            <span className="font-medium text-slate-500">Moneda:</span>{" "}
            {presupuesto.moneda}
          </span>
          <span>
            <span className="font-medium text-slate-500">Vigencia:</span>{" "}
            {presupuesto.vigencia_dias} días
          </span>
          <span>
            <span className="font-medium text-slate-500">Líneas:</span>{" "}
            {lineas.length}
          </span>
        </div>

        {/* Notas */}
        {presupuesto.notas && (
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-600 border border-slate-100">
            <span className="font-medium text-slate-500">Notas:</span>{" "}
            {presupuesto.notas}
          </div>
        )}

        {/* Tabla de líneas */}
        {lineas.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Producto</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide text-center">Cant.</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide text-right">Precio</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, i) => {
                  const tieneDescuento = Number(linea.descuento_porcentaje) > 0;
                  const tieneDescuentoExtra = linea.descuento_extra_tipo !== "ninguno" && Number(linea.descuento_extra_valor) > 0;
                  const precioPublico = Number(linea.precio_publico) || 0;
                  const precioUnitario = Number(linea.precio_unitario) || 0;
                  const esPrecioOferta = precioPublico > 0 && precioUnitario < precioPublico && !tieneDescuento;

                  return (
                    <tr key={linea.id || i} className="border-t border-slate-100">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {linea.producto_nombre || linea.variante_nombre}
                        </div>
                        {linea.variante_nombre && linea.producto_nombre && linea.variante_nombre !== linea.producto_nombre && (
                          <div className="text-xs text-slate-400">{linea.variante_nombre}</div>
                        )}
                        {linea.variante_sku && (
                          <div className="text-xs text-slate-400 font-mono">{linea.variante_sku}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {linea.cantidad}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-0.5">
                          {/* Precio público tachado si hay descuento o es oferta */}
                          {(tieneDescuento || esPrecioOferta) && precioPublico > 0 && (
                            <div className="text-xs text-slate-400">
                              {formatMonto(precioPublico, presupuesto.moneda)}
                            </div>
                          )}
                          {/* Precio unitario */}
                          <div className={`font-medium ${esPrecioOferta ? "text-emerald-600" : "text-slate-700"}`}>
                            {formatMonto(precioUnitario, presupuesto.moneda)}
                            {esPrecioOferta && (
                              <span className="ml-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                OFERTA
                              </span>
                            )}
                          </div>
                          {/* Info de descuento tier */}
                          {tieneDescuento && (
                            <div className="text-[11px] text-slate-400">
                              -{linea.descuento_porcentaje}% tier
                            </div>
                          )}
                          {/* Info de descuento extra */}
                          {tieneDescuentoExtra && (
                            <div className="text-[11px] text-amber-600">
                              {linea.descuento_extra_tipo === "porcentaje"
                                ? `−${linea.descuento_extra_valor}% extra`
                                : `−${formatMonto(linea.descuento_extra_valor, presupuesto.moneda)} extra`
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {formatMonto(linea.subtotal, presupuesto.moneda)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={3} className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-xs tracking-wide">
                    Total
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-lg text-slate-900">
                    {formatMonto(presupuesto.total, presupuesto.moneda)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Página dedicada de presupuesto ─────────────────────────────

export default function PresupuestoDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const {
    data: presupuesto,
    loading,
    execute: fetchPresupuesto,
  } = useApi(getPresupuesto);

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) fetchPresupuesto(id);
  }, [id, fetchPresupuesto]);

  // ─── Acciones ─────────────────────────────────────────────────

  const handleEnviar = async () => {
    setActionLoading(true);
    try {
      await enviarPresupuesto(id);
      showToast("Presupuesto enviado al cliente", "success");
      fetchPresupuesto(id);
    } catch (err) {
      showToast(err?.data?.detail || "Error al enviar presupuesto", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEliminar = async () => {
    const ok = await confirm(
      "¿Eliminar este presupuesto? Esta acción no se puede deshacer.",
      "Eliminar presupuesto",
      { confirmText: "Eliminar", type: "danger" }
    );
    if (!ok) return;

    setActionLoading(true);
    try {
      await deletePresupuesto(id);
      showToast("Presupuesto eliminado", "info");
      // Navegar de vuelta
      if (presupuesto?.oportunidad && presupuesto?.tipo === "pipeline") {
        router.push(`/ventas-crm/oportunidades/${presupuesto.oportunidad}`);
      } else {
        router.push("/ventas-crm/presupuestos");
      }
    } catch (err) {
      showToast(err?.data?.detail || "Error al eliminar", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAceptar = async () => {
    const ok = await confirm(
      "¿Confirmar aceptación? Se generará una Venta en borrador automáticamente.",
      "Aceptar presupuesto",
      { confirmText: "Aceptar y generar venta", type: "success" }
    );
    if (!ok) return;

    setActionLoading(true);
    try {
      const data = await aceptarPresupuesto(id);
      showToast("Presupuesto aceptado — venta generada", "success");
      // Redireccionar a la venta generada
      if (data?.venta_id) {
        router.push(`/ventas-crm/ventas/${data.venta_id}`);
      } else {
        fetchPresupuesto(id);
      }
    } catch (err) {
      showToast(err?.data?.detail || "Error al aceptar presupuesto", "error");
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
      showToast(err?.data?.detail || "Error al rechazar presupuesto", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevertir = async () => {
    const ok = await confirm(
      "¿Volver a borrador? Podrás editar el presupuesto y re-enviarlo.",
      "Volver a editar",
      { confirmText: "Volver a borrador", type: "warning" }
    );
    if (!ok) return;

    setActionLoading(true);
    try {
      await revertirBorradorPresupuesto(id);
      showToast("Presupuesto revertido a borrador", "success");
      fetchPresupuesto(id);
    } catch (err) {
      showToast(err?.data?.detail || "Error al revertir", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopiarTexto = async () => {
    try {
      const data = await getTextoPresupuesto(id);
      await navigator.clipboard.writeText(data.texto);
      showToast("Texto copiado al portapapeles", "success");
    } catch {
      showToast("Error al copiar texto", "error");
    }
  };

  const handleDescargarPdf = async () => {
    try {
      await descargarPdfPresupuesto(id);
    } catch {
      showToast("Error al descargar PDF", "error");
    }
  };

  // ─── Loading ────────────────────────────────────────────────

  if (loading && !presupuesto) {
    return <LoadingScreen texto="Cargando presupuesto..." />;
  }

  // ─── 404 ────────────────────────────────────────────────────

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
              Volver al listado
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

  const estadoBadge = ESTADO_BADGE[presupuesto.estado] || ESTADO_BADGE.borrador;

  // Breadcrumb contextual
  const breadcrumbs = esPipeline
    ? [
      { label: "Oportunidades", href: "/ventas-crm/oportunidades" },
      { label: presupuesto.oportunidad_titulo, href: `/ventas-crm/oportunidades/${presupuesto.oportunidad}` },
      { label: presupuesto.codigo },
    ]
    : [
      { label: "Presupuestos", href: "/ventas-crm/presupuestos" },
      { label: `${presupuesto.codigo} — ${presupuesto.cliente_razon_social}` },
    ];

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={breadcrumbs}
        subtitle={presupuesto.cliente_razon_social}
        subtitleClassName="text-emerald-600"
      >
        <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
      </PageHeader>

      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Barra de acciones contextual */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2.5 flex items-center justify-between">
            {/* Izquierda: compartir */}
            <div className="flex items-center gap-2">
              {presupuesto.lineas?.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Copy}
                    onClick={handleCopiarTexto}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    Copiar texto
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Download}
                    onClick={handleDescargarPdf}
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    PDF
                  </Button>
                </>
              )}
            </div>

            {/* Derecha: acciones de estado */}
            <div className="flex items-center gap-2">
              {/* Borrador: Eliminar */}
              {esBorrador && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={handleEliminar}
                  disabled={actionLoading}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </Button>
              )}

              {/* Enviado: Volver a editar, Aceptar, Rechazar */}
              {esEnviado && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Pencil}
                    onClick={handleRevertir}
                    disabled={actionLoading}
                  >
                    Volver a editar
                  </Button>
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          {readOnly ? (
            <PresupuestoReadOnly presupuesto={presupuesto} />
          ) : (
            <ConstructorPresupuesto
              oportunidadId={presupuesto.oportunidad}
              presupuestoBorrador={presupuesto}
              tierPrecio={presupuesto.cliente_tier_precio || "publico"}
              productosInteres={[]}
              onEnviar={handleEnviar}
              onEliminar={handleEliminar}
            />
          )}
        </div>
      </main>
    </div>
  );
}
