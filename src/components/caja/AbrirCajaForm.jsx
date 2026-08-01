"use client";
import { useState, useEffect } from "react";
import { Button, Badge } from "@/components/ui";
import { useToast } from "@/components/ui";
import { abrirCaja } from "@/services/apis/caja";
import { getTipoCambioVigente, createTipoCambio } from "@/services/apis/ventas";
import { Wallet, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers de formato ─────────────────────────────────────────

function formatPYG(value) {
  if (!value && value !== 0) return "";
  const num = parseInt(String(value).replace(/\D/g, ""), 10);
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("es-PY");
}

function formatDecimal(value) {
  if (!value && value !== 0) return "";
  const num = Number(value);
  if (isNaN(num) || num === 0) return "";
  const parts = num.toFixed(2).split(".");
  const intPart = parseInt(parts[0], 10);
  return `${intPart.toLocaleString("es-PY")},${parts[1]}`;
}

function parsePYG(formatted) {
  if (!formatted) return 0;
  return parseInt(String(formatted).replace(/\D/g, ""), 10) || 0;
}

function parseDecimal(formatted) {
  if (!formatted) return 0;
  const clean = String(formatted).replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

/** Formatea un valor de tipo de cambio sin ceros innecesarios */
function formatTCValor(valor) {
  const num = Number(valor);
  if (isNaN(num)) return "0";
  // Si es entero (ej: 7500), sin decimales
  if (Number.isInteger(num)) return num.toLocaleString("es-PY");
  // Si tiene decimales, máximo 2 sin trailing zeros
  const fixed = parseFloat(num.toFixed(2));
  if (Number.isInteger(fixed)) return fixed.toLocaleString("es-PY");
  return fixed.toLocaleString("es-PY", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

// ─── Input de moneda con formato ────────────────────────────────

function MonedaInput({ label, symbol, value, onChange, error, isPYG, disabled }) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (isPYG) return value ? formatPYG(value) : "";
    return value ? formatDecimal(value) : "";
  });

  const handleChange = (e) => {
    const raw = e.target.value;
    if (isPYG) {
      const digits = raw.replace(/\D/g, "");
      const num = parseInt(digits, 10) || 0;
      setDisplayValue(num > 0 ? num.toLocaleString("es-PY") : "");
      onChange(num);
    } else {
      setDisplayValue(raw);
      const normalized = raw.replace(/\./g, "").replace(",", ".");
      onChange(parseFloat(normalized) || 0);
    }
  };

  const handleBlur = () => {
    if (isPYG) {
      const num = parsePYG(displayValue);
      setDisplayValue(num > 0 ? formatPYG(num) : "");
    } else {
      const num = parseDecimal(displayValue);
      setDisplayValue(num > 0 ? formatDecimal(num) : "");
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
          {symbol}
        </span>
        <input
          type="text"
          inputMode={isPYG ? "numeric" : "decimal"}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0"
          disabled={disabled}
          className={cn(
            "w-full pl-8 pr-4 py-3 rounded-xl border text-sm font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
            error ? "border-red-300 bg-red-50/50" : "border-slate-200"
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

// ─── Widget de Tipo de Cambio con banderas ──────────────────────

const TC_PARES = [
  { par: "USD/PYG", from: "🇺🇸", to: "🇵🇾", toLabel: "PYG", symbol: "₲" },
  { par: "USD/BRL", from: "🇺🇸", to: "🇧🇷", toLabel: "BRL", symbol: "R$" },
];

function TipoCambioMiniCards() {
  const { showToast } = useToast();
  const [tasas, setTasas] = useState({});
  const [loading, setLoading] = useState(true);
  const [editandoPar, setEditandoPar] = useState(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all(
      TC_PARES.map(({ par }) =>
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
      showToast(err?.data?.detail || "Error", "error");
    } finally { setGuardando(false); }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {TC_PARES.map(({ par, from, to, toLabel, symbol }) => {
        const tc = tasas[par];
        const isEditing = editandoPar === par;

        if (loading) {
          return <div key={par} className="h-14 rounded-xl bg-slate-100 animate-pulse" />;
        }

        if (isEditing) {
          return (
            <div key={par} className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-lg">{from}{to}</span>
              <div className="flex-1 min-w-0">
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
                  className="w-full px-2 py-1 rounded-lg border border-blue-300 bg-white text-xs font-bold text-slate-700 outline-none"
                />
              </div>
              <button
                onClick={() => handleGuardar(par)}
                disabled={guardando}
                className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                {guardando ? "..." : "OK"}
              </button>
            </div>
          );
        }

        return (
          <button
            key={par}
            type="button"
            onClick={() => { setEditandoPar(par); setNuevoValor(tc ? formatTCValor(tc.valor) : ""); }}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
              tc
                ? "bg-white border-slate-200 hover:border-emerald-300"
                : "bg-amber-50 border-amber-200"
            )}
          >
            <span className="text-lg shrink-0">{from}{to}</span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase">{toLabel}</p>
              {tc ? (
                <p className="text-xs font-black text-slate-800">{symbol} {formatTCValor(tc.valor)}</p>
              ) : (
                <p className="text-[10px] font-bold text-amber-600">Cargar</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Formulario Principal ───────────────────────────────────────

export default function AbrirCajaForm({ onSuccess }) {
  const { showToast } = useToast();
  const [fondoPyg, setFondoPyg] = useState(0);
  const [fondoUsd, setFondoUsd] = useState(0);
  const [fondoBrl, setFondoBrl] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (fondoPyg < 0) errors.fondo_pyg = "El monto no puede ser negativo.";
    if (fondoUsd < 0) errors.fondo_usd = "El monto no puede ser negativo.";
    if (fondoBrl < 0) errors.fondo_brl = "El monto no puede ser negativo.";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      await abrirCaja({
        fondo_pyg: fondoPyg,
        fondo_usd: fondoUsd,
        fondo_brl: fondoBrl,
      });
      showToast("Caja abierta correctamente", "success");
      if (onSuccess) onSuccess();
    } catch (err) {
      const message =
        err?.data?.detail ||
        err?.data?.non_field_errors?.[0] ||
        err?.message ||
        "Error al abrir caja. Intente nuevamente.";
      setError(message);

      if (err?.data && typeof err.data === "object") {
        const apiFieldErrors = {};
        if (err.data.fondo_pyg) {
          apiFieldErrors.fondo_pyg = Array.isArray(err.data.fondo_pyg)
            ? err.data.fondo_pyg.join(", ") : err.data.fondo_pyg;
        }
        if (err.data.fondo_usd) {
          apiFieldErrors.fondo_usd = Array.isArray(err.data.fondo_usd)
            ? err.data.fondo_usd.join(", ") : err.data.fondo_usd;
        }
        if (err.data.fondo_brl) {
          apiFieldErrors.fondo_brl = Array.isArray(err.data.fondo_brl)
            ? err.data.fondo_brl.join(", ") : err.data.fondo_brl;
        }
        if (Object.keys(apiFieldErrors).length > 0) setFieldErrors(apiFieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Tipos de cambio vigentes */}
      <TipoCambioMiniCards />

      {/* Fondos iniciales */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Fondo Inicial
        </h4>

        <MonedaInput
          label="Guaraníes (PYG)"
          symbol="₲"
          value={fondoPyg}
          onChange={setFondoPyg}
          isPYG
          error={fieldErrors.fondo_pyg}
          disabled={loading}
        />

        <MonedaInput
          label="Dólares (USD)"
          symbol="$"
          value={fondoUsd}
          onChange={setFondoUsd}
          error={fieldErrors.fondo_usd}
          disabled={loading}
        />

        <MonedaInput
          label="Reales (BRL)"
          symbol="R$"
          value={fondoBrl}
          onChange={setFondoBrl}
          error={fieldErrors.fondo_brl}
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        icon={Wallet}
        className="w-full justify-center"
      >
        {loading ? "Abriendo Caja..." : "Abrir Caja"}
      </Button>
    </form>
  );
}
