"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader, Badge, Button, Input, Section, LoadingScreen } from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useApi } from "@/hooks/useApi";
import { getSesionDetalle, cerrarCaja } from "@/services/apis/caja";
import { Wallet, Calculator, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const MONEDAS = [
  { key: "PYG", label: "Guaraníes (PYG)", prefix: "₲" },
  { key: "USD", label: "Dólares (USD)", prefix: "US$" },
  { key: "BRL", label: "Reales (BRL)", prefix: "R$" },
];

function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SesionDetallePage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const { data: sesion, loading, refetch } = useApi(getSesionDetalle, {
    auto: true,
    args: [id],
  });

  const { execute: ejecutarCierre, loading: cerrando } = useApi(cerrarCaja);

  const [fisico, setFisico] = useState({ pyg: "", usd: "", brl: "" });
  const [mostrarCierre, setMostrarCierre] = useState(false);

  const handleCerrar = async (e) => {
    e.preventDefault();
    try {
      await ejecutarCierre(id, {
        fisico_pyg: Number(fisico.pyg) || 0,
        fisico_usd: Number(fisico.usd) || 0,
        fisico_brl: Number(fisico.brl) || 0,
      });
      showToast("Caja cerrada correctamente", "success");
      refetch();
      setMostrarCierre(false);
    } catch {
      showToast("Error al cerrar la caja", "error");
    }
  };

  if (loading || !sesion) {
    return <LoadingScreen texto="Cargando sesión..." />;
  }

  const estaAbierta = sesion.estado === "abierta";

  // Calcular ingresos y egresos por moneda desde los movimientos
  const totalesPorMoneda = MONEDAS.reduce((acc, { key }) => {
    const movs = sesion.movimientos || [];
    const ingresos = movs
      .filter((m) => m.tipo === "ingreso" && m.moneda === key)
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const egresos = movs
      .filter((m) => m.tipo === "egreso" && m.moneda === key)
      .reduce((sum, m) => sum + Number(m.monto), 0);
    acc[key] = { ingresos, egresos };
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Sesiones de Caja", href: "/caja/sesiones" },
          { label: `Sesión #${sesion.id}` },
        ]}
        subtitle={
          <>
            <Wallet size={12} />
            {sesion.cajero_nombre} — {formatFecha(sesion.abierta_at)}
          </>
        }
      >
        <Badge variant={estaAbierta ? "success" : "default"}>
          {estaAbierta ? "Abierta" : "Cerrada"}
        </Badge>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Resumen por moneda */}
          <Section title="Resumen de Caja" subtitle="Fondo inicial, ingresos, egresos, saldo teórico, monto físico y diferencias">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3">Moneda</th>
                    <th className="px-6 py-3 text-right">Fondo Inicial</th>
                    <th className="px-6 py-3 text-right">Ingresos</th>
                    <th className="px-6 py-3 text-right">Egresos</th>
                    <th className="px-6 py-3 text-right">Saldo Teórico</th>
                    <th className="px-6 py-3 text-right">Monto Físico</th>
                    <th className="px-6 py-3 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MONEDAS.map(({ key, label }) => {
                    const fondoKey = `fondo_${key.toLowerCase()}`;
                    const fisicoKey = `fisico_${key.toLowerCase()}`;
                    const difKey = `diferencia_${key.toLowerCase()}`;
                    const saldoTeorico = sesion.saldos_teoricos?.[key];
                    const diferencia = sesion[difKey];
                    const difNum = Number(diferencia) || 0;
                    const { ingresos, egresos } = totalesPorMoneda[key];

                    return (
                      <tr key={key} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-bold text-slate-700">{label}</td>
                        <td className="px-6 py-3 text-right font-medium">{formatMonto(sesion[fondoKey], key)}</td>
                        <td className="px-6 py-3 text-right font-medium text-emerald-600">
                          {formatMonto(ingresos, key)}
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-red-500">
                          {formatMonto(egresos, key)}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">
                          {formatMonto(saldoTeorico, key)}
                        </td>
                        <td className="px-6 py-3 text-right font-medium">
                          {sesion[fisicoKey] != null ? formatMonto(sesion[fisicoKey], key) : "—"}
                        </td>
                        <td className={cn(
                          "px-6 py-3 text-right font-bold",
                          difNum > 0 ? "text-emerald-600" : difNum < 0 ? "text-red-600" : "text-slate-500"
                        )}>
                          {diferencia != null && sesion[fisicoKey] != null
                            ? formatMonto(diferencia, key)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Movimientos de la sesión */}
          <Section
            title="Movimientos"
            subtitle="Cobros y movimientos manuales registrados en esta sesión"
            action={
              <span className="text-xs text-slate-400 font-bold">
                {sesion.movimientos?.length || 0} registros
              </span>
            }
          >
            {sesion.movimientos && sesion.movimientos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Tipo</th>
                      <th className="px-6 py-3">Origen</th>
                      <th className="px-6 py-3">Concepto</th>
                      <th className="px-6 py-3 text-right">Monto</th>
                      <th className="px-6 py-3">Moneda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sesion.movimientos.map((mov, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 text-slate-500 text-xs">
                          {formatFecha(mov.created_at)}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={mov.tipo === "ingreso" ? "success" : "danger"}>
                            {mov.tipo_display || mov.tipo}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-slate-600 font-medium">
                          {mov.origen_display || mov.origen || "—"}
                        </td>
                        <td className="px-6 py-3 text-slate-700">
                          {mov.concepto}
                        </td>
                        <td className={cn(
                          "px-6 py-3 text-right font-bold",
                          mov.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"
                        )}>
                          {mov.tipo === "ingreso" ? "+" : "−"}{formatMonto(mov.monto, mov.moneda)}
                        </td>
                        <td className="px-6 py-3 text-slate-500 font-medium">
                          {mov.moneda_display || mov.moneda}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                No hay movimientos registrados en esta sesión.
              </div>
            )}
          </Section>

          {/* Pedidos cobrados */}
          <Section
            title="Pedidos Cobrados"
            subtitle="Pedidos cobrados durante esta sesión"
          >
            {sesion.pedidos_cobrados && sesion.pedidos_cobrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3"># Pedido</th>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Fecha Cobro</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3">Moneda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sesion.pedidos_cobrados.map((pedido, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-bold text-slate-700">
                          #{pedido.id}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {pedido.cliente_nombre || "—"}
                        </td>
                        <td className="px-6 py-3 text-slate-500 text-xs">
                          {formatFecha(pedido.cobrado_at)}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">
                          {formatMonto(pedido.total, pedido.moneda)}
                        </td>
                        <td className="px-6 py-3 text-slate-500 font-medium">
                          {pedido.moneda || "PYG"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                No hay pedidos cobrados en esta sesión.
              </div>
            )}
          </Section>

          {/* Cerrar Caja — solo si sesión abierta */}
          {estaAbierta && (
            <Section
              title="Cerrar Caja"
              subtitle="Declare los montos físicos contados para realizar el arqueo"
              action={
                !mostrarCierre && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Lock}
                    onClick={() => setMostrarCierre(true)}
                  >
                    Cerrar Caja
                  </Button>
                )
              }
            >
              {mostrarCierre ? (
                <form onSubmit={handleCerrar} className="p-6 space-y-6">
                  <p className="text-sm text-slate-600">
                    Ingrese los montos físicos contados en cada moneda para calcular el arqueo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Monto Físico PYG (₲)"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={fisico.pyg}
                      onChange={(e) => setFisico({ ...fisico, pyg: e.target.value })}
                    />
                    <Input
                      label="Monto Físico USD (US$)"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={fisico.usd}
                      onChange={(e) => setFisico({ ...fisico, usd: e.target.value })}
                    />
                    <Input
                      label="Monto Físico BRL (R$)"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={fisico.brl}
                      onChange={(e) => setFisico({ ...fisico, brl: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      variant="danger"
                      icon={Lock}
                      disabled={cerrando}
                    >
                      {cerrando ? "Cerrando..." : "Confirmar Cierre"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setMostrarCierre(false)}
                      disabled={cerrando}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="px-6 py-8 text-center text-slate-400 text-sm">
                  <Calculator size={24} className="mx-auto mb-2 text-slate-300" />
                  Presione &quot;Cerrar Caja&quot; para declarar los montos físicos y generar el arqueo.
                </div>
              )}
            </Section>
          )}

          {/* Info de cierre si ya está cerrada */}
          {!estaAbierta && sesion.cerrada_at && (
            <div className="text-center text-sm text-slate-400 py-4">
              <Clock size={14} className="inline mr-1" />
              Sesión cerrada el {formatFecha(sesion.cerrada_at)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
