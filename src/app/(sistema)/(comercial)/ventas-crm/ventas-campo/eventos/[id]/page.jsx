"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play, Square, CheckCircle, XCircle, Package, ShoppingCart,
  Users, Plus, Trash2, RefreshCw, Truck,
} from "lucide-react";
import {
  LoadingScreen, PageHeader, Section, Button, Badge,
  useToast, useConfirm, EmptyState,
} from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  getEvento, activarEvento, cerrarEvento, rendirEvento, cancelarEvento,
  getStockEvento, getSolicitudes,
} from "@/services/apis/ventas-campo";
import { getVentas } from "@/services/apis/ventas";

// ─── Config ─────────────────────────────────────────────────────

const ESTADO_BADGE = {
  preparacion: { variant: "warning", label: "En Preparación" },
  activo: { variant: "success", label: "Activo" },
  cierre: { variant: "info", label: "En Cierre" },
  rendido: { variant: "default", label: "Rendido" },
  cancelado: { variant: "danger", label: "Cancelado" },
};

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Página ─────────────────────────────────────────────────────

export default function EventoDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm, danger } = useConfirm();

  const { data: evento, execute: fetchEvento } = useApi(getEvento);
  const { data: stockData, execute: fetchStock } = useApi(getStockEvento);
  const { data: ventasData, execute: fetchVentas } = useApi(getVentas);
  const { data: solicitudesData, execute: fetchSolicitudes } = useApi(getSolicitudes);

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("stock");

  useEffect(() => {
    if (id) {
      fetchEvento(id);
      fetchStock(id);
      fetchVentas({ evento_campo: id });
      fetchSolicitudes({ evento: id });
    }
  }, [id, fetchEvento, fetchStock, fetchVentas, fetchSolicitudes]);

  // ─── Transiciones ───────────────────────────────────────────
  const handleTransicion = async (action, label) => {
    const ok = await confirm(`¿${label} este evento?`, label);
    if (!ok) return;
    setSaving(true);
    try {
      await action(id);
      showToast(`Evento ${label.toLowerCase()} correctamente.`, "success");
      fetchEvento(id);
    } catch (err) {
      showToast(err?.data?.detail || err?.message || "Error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = async () => {
    const ok = await danger("¿Cancelar este evento? Las salidas en borrador se rechazarán.", "Cancelar Evento");
    if (!ok) return;
    setSaving(true);
    try {
      await cancelarEvento(id);
      showToast("Evento cancelado.", "success");
      fetchEvento(id);
    } catch (err) {
      showToast(err?.data?.detail || "Error", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!evento) return <LoadingScreen texto="Cargando evento..." />;

  const stock = stockData || [];
  const ventas = ventasData?.results || [];
  const solicitudes = solicitudesData?.results || [];
  const badge = ESTADO_BADGE[evento.estado] || { variant: "default", label: evento.estado };
  const esActivo = evento.estado === "activo";
  const cerrado = evento.estado === "rendido" || evento.estado === "cancelado";

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas de Campo", href: "/ventas-crm/ventas-campo/eventos" },
          { label: evento.titulo },
        ]}
        subtitle={<Badge variant={badge.variant}>{badge.label}</Badge>}
      >
        <div className="flex items-center gap-2">
          {evento.estado === "preparacion" && (
            <>
              <Button
                variant="success" size="sm" icon={Play} disabled={saving}
                onClick={() => handleTransicion(activarEvento, "Activar")}
              >Activar</Button>
              <Button
                variant="danger" size="sm" icon={XCircle} disabled={saving}
                onClick={handleCancelar}
              >Cancelar</Button>
            </>
          )}
          {evento.estado === "activo" && (
            <>
              <Link href={`/ventas-crm/ventas-campo/eventos/${id}/pos`}>
                <Button variant="primary" size="sm" icon={ShoppingCart}>POS Campo</Button>
              </Link>
              <Button
                variant="warning" size="sm" icon={Square} disabled={saving}
                onClick={() => handleTransicion(cerrarEvento, "Cerrar")}
              >Cerrar</Button>
            </>
          )}
          {evento.estado === "cierre" && (
            <Button
              variant="success" size="sm" icon={CheckCircle} disabled={saving}
              onClick={() => handleTransicion(rendirEvento, "Rendir")}
            >Rendir</Button>
          )}
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Info General */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <Text variant="label" className="text-slate-400 text-[11px] uppercase tracking-wider">Detalles</Text>
              <p className="text-sm"><span className="text-slate-400">Tipo:</span> <span className="font-medium capitalize">{evento.tipo}</span></p>
              <p className="text-sm"><span className="text-slate-400">Ubicación:</span> <span className="font-medium">{evento.ubicacion || "—"}</span></p>
              <p className="text-sm"><span className="text-slate-400">Fecha:</span> <span className="font-medium">{formatFecha(evento.fecha_inicio)}{evento.fecha_fin ? ` — ${formatFecha(evento.fecha_fin)}` : ""}</span></p>
              <p className="text-sm"><span className="text-slate-400">Depósito:</span> <span className="font-medium">{evento.deposito_nombre}</span></p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <Text variant="label" className="text-slate-400 text-[11px] uppercase tracking-wider">Vendedores Asignados</Text>
              {evento.asignaciones?.length > 0 ? (
                <ul className="space-y-1">
                  {evento.asignaciones.map(a => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{a.vendedor_nombre}</span>
                      {a.es_responsable && <Badge variant="info">Responsable</Badge>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic">Sin vendedores asignados</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <Text variant="label" className="text-slate-400 text-[11px] uppercase tracking-wider">Resumen</Text>
              <p className="text-sm"><span className="text-slate-400">Ventas:</span> <span className="font-bold text-emerald-600">{ventas.length}</span></p>
              <p className="text-sm"><span className="text-slate-400">Productos en stock:</span> <span className="font-bold">{stock.length}</span></p>
              <p className="text-sm"><span className="text-slate-400">Solicitudes:</span> <span className="font-bold">{solicitudes.length}</span></p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-slate-200 pb-px gap-1 overflow-x-auto">
            {[
              { key: "stock", label: "Stock del Evento", icon: Package },
              { key: "ventas", label: "Ventas Realizadas", icon: ShoppingCart },
              { key: "solicitudes", label: "Solicitudes de Reposición", icon: Truck },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap outline-none",
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in-50 duration-200">
            {activeTab === "stock" && <StockTab stock={stock} />}
            {activeTab === "ventas" && <VentasTab ventas={ventas} />}
            {activeTab === "solicitudes" && <SolicitudesTab solicitudes={solicitudes} eventoActivo={esActivo} eventoId={id} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Tab Components ─────────────────────────────────────────────

function StockTab({ stock }) {
  if (stock.length === 0) {
    return <EmptyState titulo="Sin stock asignado" descripcion="Aprobá una salida provisoria vinculada a este evento para cargar stock." />;
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Producto</th>
            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Código</th>
            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Lote</th>
            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Vencimiento</th>
            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Disponible</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((item, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="py-3 pl-6 pr-4 text-sm font-medium text-slate-800">{item.variante_nombre}</td>
              <td className="py-3 px-4 text-xs font-mono text-slate-500">{item.variante_codigo}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{item.lote_codigo}</td>
              <td className="py-3 px-4 text-xs text-slate-500">
                {item.vencimiento ? new Date(item.vencimiento).toLocaleDateString("es-PY") : "—"}
              </td>
              <td className="py-3 px-4 text-right text-sm font-bold text-slate-800">{item.disponible}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VentasTab({ ventas }) {
  const router = useRouter();
  if (ventas.length === 0) {
    return <EmptyState titulo="Sin ventas" descripcion="Las ventas realizadas desde el POS de campo aparecerán aquí." />;
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">ID</th>
            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Cliente</th>
            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Vendedor</th>
            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Total USD</th>
            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map(venta => (
            <tr
              key={venta.id}
              className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/ventas-crm/ventas/${venta.id}`)}
            >
              <td className="py-3 pl-6 pr-4 text-sm font-semibold text-blue-600">V-{venta.id}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{venta.cliente_nombre || "Sin cliente"}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{venta.vendedor_nombre || "—"}</td>
              <td className="py-3 px-4 text-right text-sm font-bold">${Number(venta.total_usd || 0).toFixed(2)}</td>
              <td className="py-3 px-4 text-xs text-slate-400">
                {venta.created_at ? new Date(venta.created_at).toLocaleDateString("es-PY") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SolicitudesTab({ solicitudes, eventoActivo, eventoId }) {
  const ESTADO_SOL_BADGE = {
    pendiente: { variant: "warning", label: "Pendiente" },
    aprobada: { variant: "info", label: "Aprobada" },
    enviada: { variant: "primary", label: "Enviada" },
    recibida: { variant: "success", label: "Recibida" },
    rechazada: { variant: "danger", label: "Rechazada" },
  };

  return (
    <div className="space-y-4">
      {eventoActivo && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" icon={Plus}>
            Nueva Solicitud
          </Button>
        </div>
      )}
      {solicitudes.length === 0 ? (
        <EmptyState titulo="Sin solicitudes" descripcion="Las solicitudes de reposición aparecerán aquí cuando se necesiten más productos." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">ID</th>
                <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Solicitado por</th>
                <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Estado</th>
                <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Ítems</th>
                <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(sol => {
                const b = ESTADO_SOL_BADGE[sol.estado] || { variant: "default", label: sol.estado };
                return (
                  <tr key={sol.id} className="border-t border-slate-100">
                    <td className="py-3 pl-6 pr-4 text-sm font-semibold text-slate-800">#{sol.id}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{sol.solicitado_por_nombre}</td>
                    <td className="py-3 px-4 text-center"><Badge variant={b.variant}>{b.label}</Badge></td>
                    <td className="py-3 px-4 text-sm text-slate-600">{sol.cantidad_items} producto{sol.cantidad_items !== 1 ? "s" : ""}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {sol.created_at ? new Date(sol.created_at).toLocaleDateString("es-PY") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
