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
  CheckCircle,
  XCircle,
  Settings,
  ChevronDown,
  CreditCard,
} from "lucide-react";
import { PageHeader, Button, Badge } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getSesiones, getColaCobro } from "@/services/apis/caja";
import { getVentas, getTipoCambioVigente, createTipoCambio } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────

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

function QuickLink({ href, icon: Icon, label, description, badge, badgeColor }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition-all"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors shrink-0">
        <Icon className="h-5 w-5 text-purple-600" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
            {label}
          </p>
          {badge && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              badgeColor || "bg-amber-100 text-amber-700"
            )}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Estado de Sesión ───────────────────────────────────────────

function SesionCard({ sesion, loading }) {
  if (loading) {
    return (
      <div className="p-5 rounded-2xl border-2 border-slate-200 bg-white animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-3 bg-slate-100 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (sesion) {
    return (
      <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-800">Caja abierta</p>
              <p className="text-xs text-emerald-600">
                Sesión activa desde {new Date(sesion.abierta_at).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date(sesion.abierta_at).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <Link href="/caja/cobros">
            <Button variant="success" size="sm" icon={Receipt}>
              Ir a cobrar
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <XCircle className="h-5 w-5 text-slate-400" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-700">Caja cerrada</p>
            <p className="text-xs text-slate-400">Abrí una sesión para empezar a cobrar</p>
          </div>
        </div>
        <Link href="/caja/sesiones">
          <Button variant="primary" size="sm" icon={Wallet}>
            Abrir caja
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Tipo de Cambio Widget ──────────────────────────────────────

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

export default function CajaPage() {
  const { showToast } = useToast();
  const [showConfig, setShowConfig] = useState(false);

  // Estado de sesión activa del cajero
  const { data: sesionesData, loading: loadingSesion, execute: fetchSesiones } = useApi(getSesiones, {
    auto: false, initialData: null,
  });

  // Contadores de pendientes
  const { data: colaCaja, execute: fetchColaCaja } = useApi(getColaCobro, { auto: false });
  const { data: colaOnline, execute: fetchColaOnline } = useApi(getVentas, { auto: false });

  useEffect(() => {
    fetchSesiones({ estado: "abierta", page_size: 1 });
    fetchColaCaja({ page_size: 1 });
    fetchColaOnline({ estado: "confirmado", metodo_cobro: "pasarela_online", page_size: 1 });
  }, [fetchSesiones, fetchColaCaja, fetchColaOnline]);

  const sesionActiva = sesionesData?.results?.[0] || null;
  const pendientesCaja = colaCaja?.count ?? null;
  const pendientesOnline = colaOnline?.count ?? null;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Caja"
        subtitle="Cobros, entregas y facturación"
        subtitleClassName="text-purple-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ─── MI CAJA ────────────────────────────────────── */}
          <SesionCard sesion={sesionActiva} loading={loadingSesion} />

          {/* ─── RESUMEN RÁPIDO ──────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Pendientes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                icon={Store}
                label="Cobros"
                count={pendientesCaja}
                color="bg-purple-500"
                href="/caja/cobros"
              />
              <StatCard
                icon={Globe}
                label="Pagos Online"
                count={pendientesOnline}
                color="bg-emerald-500"
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
                href="/caja/cobros"
                icon={Receipt}
                label="Cobros"
                description="Cobrar pendientes y consultar historial"
                badge={pendientesCaja > 0 ? `${pendientesCaja}` : null}
              />
              <QuickLink
                href="/caja/sesiones"
                icon={Wallet}
                label="Sesiones de Caja"
                description="Apertura, cierre y control de sesiones"
              />
              <QuickLink
                href="/caja/documentos"
                icon={FileText}
                label="Documentos"
                description="Cobros, facturas y notas de crédito"
              />
            </div>
          </div>

          {/* ─── CONFIGURACIÓN (colapsable) ──────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors mb-3"
            >
              <Settings size={12} />
              Configuración
              <ChevronDown size={12} className={cn("transition-transform", showConfig && "rotate-180")} />
            </button>
            {showConfig && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickLink
                  href="/caja/timbrados"
                  icon={Bookmark}
                  label="Timbrados"
                  description="Gestión de timbrados y numeración fiscal"
                />
                <QuickLink
                  href="/caja/puntos-expedicion"
                  icon={Store}
                  label="Puntos de Expedición"
                  description="Establecimientos y puntos de emisión"
                />
                <QuickLink
                  href="/caja/terminales-pos"
                  icon={CreditCard}
                  label="Terminales POS"
                  description="Configurar terminales, comisiones y cuentas bancarias"
                />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
