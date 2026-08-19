"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Wallet,
  FileText,
  Bookmark,
  ChevronRight,
  Globe,
  Store,
  FileMinusIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getColaCobro } from "@/services/apis/caja";
import { getVentas, getTipoCambioVigente, createTipoCambio } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

/** Formatea un valor de tipo de cambio sin ceros innecesarios */
function formatTCValor(valor) {
  const num = Number(valor);
  if (isNaN(num)) return "0";
  if (Number.isInteger(num)) return num.toLocaleString("es-PY");
  const fixed = parseFloat(num.toFixed(2));
  if (Number.isInteger(fixed)) return fixed.toLocaleString("es-PY");
  return fixed.toLocaleString("es-PY", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({ icon: Icon, label, count, color, href }) {
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white transition-all",
        href && "hover:shadow-md hover:border-purple-300 cursor-pointer",
        !href && "cursor-default"
      )}
    >
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0", color)}>
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium truncate">{label}</p>
        <p className="text-lg font-black text-slate-800">{count ?? "—"}</p>
      </div>
      {href && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
    </Wrapper>
  );
}

// ─── Quick Link ─────────────────────────────────────────────────

function QuickLink({ href, icon: Icon, label, description }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition-all"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors shrink-0">
        <Icon className="h-5 w-5 text-purple-600" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
          {label}
        </p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Tipo de Cambio Widget con banderas ─────────────────────────

const PARES_CONFIG = [
  { par: "USD/PYG", from: "🇺🇸", to: "🇵🇾", fromLabel: "USD", toLabel: "PYG", symbol: "₲" },
  { par: "USD/BRL", from: "🇺🇸", to: "🇧🇷", fromLabel: "USD", toLabel: "BRL", symbol: "R$" },
];

function TipoCambioCard() {
  const { showToast } = useToast();
  const [tasas, setTasas] = useState({});
  const [loading, setLoading] = useState(true);
  const [editandoPar, setEditandoPar] = useState(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all(
      PARES_CONFIG.map(({ par }) =>
        getTipoCambioVigente(par).then((tc) => ({ par, tc })).catch(() => ({ par, tc: null }))
      )
    ).then((results) => {
      const map = {};
      results.forEach(({ par, tc }) => { map[par] = tc; });
      setTasas(map);
      setLoading(false);
    });
  }, []);

  const handleGuardar = async (par) => {
    const clean = nuevoValor.replace(/\./g, "").replace(",", ".");
    const valor = parseFloat(clean);
    if (!valor || valor <= 0) { showToast("Valor inválido", "error"); return; }
    // Limitar decimales: PYG sin decimales, otros máx 2
    const parTo = par.split("/")[1];
    const valorFinal = parTo === "PYG" ? Math.round(valor) : Math.round(valor * 100) / 100;
    setGuardando(true);
    try {
      const hoy = new Date().toISOString().split("T")[0];
      const nuevo = await createTipoCambio({ par, valor: valorFinal, fecha_vigencia: hoy });
      setTasas((prev) => ({ ...prev, [par]: nuevo }));
      setEditandoPar(null);
      showToast("Tipo de cambio actualizado", "success");
    } catch (err) {
      showToast(err?.data?.detail || "Error al guardar", "error");
    } finally { setGuardando(false); }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PARES_CONFIG.map(({ par, from, to, fromLabel, toLabel, symbol }) => {
        const tc = tasas[par];
        const isEditing = editandoPar === par;

        if (loading) {
          return (
            <div key={par} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-20" />
                <div className="h-4 bg-slate-100 rounded w-24" />
              </div>
            </div>
          );
        }

        if (isEditing) {
          return (
            <div key={par} className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <span className="text-2xl">{from}{to}</span>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">{fromLabel} → {toLabel}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{symbol}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGuardar(par);
                      if (e.key === "Escape") setEditandoPar(null);
                    }}
                    autoFocus
                    placeholder={tc ? formatTCValor(tc.valor) : "0"}
                    className="w-full px-2 py-1.5 rounded-lg border border-blue-300 bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleGuardar(par)}
                  disabled={guardando}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-colors"
                >
                  {guardando ? "..." : "Guardar"}
                </button>
                <button
                  onClick={() => setEditandoPar(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-[10px] font-bold hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          );
        }

        return (
          <button
            key={par}
            type="button"
            onClick={() => { setEditandoPar(par); setNuevoValor(tc ? formatTCValor(tc.valor) : ""); }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer group",
              tc
                ? "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                : "bg-amber-50 border-amber-200 hover:border-amber-300"
            )}
          >
            <span className="text-2xl shrink-0">{from}{to}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{fromLabel} → {toLabel}</p>
              {tc ? (
                <p className="text-base font-black text-slate-800">
                  {symbol} {formatTCValor(tc.valor)}
                </p>
              ) : (
                <p className="text-sm font-bold text-amber-600">Sin cotización</p>
              )}
            </div>
            <span className="text-[9px] text-slate-300 group-hover:text-blue-500 font-semibold transition-colors">
              {tc ? "Editar" : "Cargar"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function CajaFacturacionPage() {
  // Fetch pedidos pendientes por canal
  const { data: colaCaja, execute: fetchColaCaja } = useApi(getColaCobro);
  const { data: colaOnline, execute: fetchColaOnline } = useApi(getVentas);

  useEffect(() => {
    fetchColaCaja({ page_size: 1 });
    fetchColaOnline({ estado: "confirmado", metodo_cobro: "pasarela_online", page_size: 1 });
  }, [fetchColaCaja, fetchColaOnline]);

  const pendientesCaja = colaCaja?.count ?? null;
  const pendientesOnline = colaOnline?.count ?? null;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Caja y Facturación"
        subtitle="Panel principal"
        subtitleClassName="text-purple-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ─── RESUMEN RÁPIDO ──────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Pendientes hoy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                icon={Store}
                label="Cola de Caja"
                count={pendientesCaja}
                color="bg-purple-500"
                href="/caja/cola"
              />
              <StatCard
                icon={Globe}
                label="Pagos Online"
                count={pendientesOnline}
                color="bg-blue-500"
              />
            </div>
          </div>

          {/* ─── TIPO DE CAMBIO ─────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Cotización del día
            </h3>
            <TipoCambioCard />
          </div>

          {/* ─── OPERACIÓN DIARIA ────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Operación diaria
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickLink
                href="/caja/cola"
                icon={Receipt}
                label="Cola de Cobro"
                description="Pedidos presenciales pendientes de cobro"
              />
              <QuickLink
                href="/caja/sesiones"
                icon={Wallet}
                label="Sesiones de Caja"
                description="Apertura, cierre y control de sesiones"
              />
            </div>
          </div>

          {/* ─── FACTURACIÓN Y CONFIGURACIÓN ─────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Facturación y configuración
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickLink
                href="/caja/facturas"
                icon={FileText}
                label="Facturas y Comprobantes"
                description="Emisión y consulta de comprobantes"
              />
              <QuickLink
                href="/caja/notas-credito-internas"
                icon={FileMinusIcon}
                label="Notas de Crédito Internas"
                description="NC por faltantes en entregas (sin validez fiscal)"
              />
              <QuickLink
                href="/caja/timbrados"
                icon={Bookmark}
                label="Timbrados"
                description="Gestión de timbrados y numeración"
              />
              <QuickLink
                href="/caja/puntos-expedicion"
                icon={Store}
                label="Puntos de Expedición"
                description="Establecimientos y puntos de emisión"
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
