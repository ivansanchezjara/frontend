"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Plus, ArrowRight } from "lucide-react";
import {
  Button, LoadingScreen, EmptyState, Input, Field, MontoInput, Badge,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getCuentas, createCuenta, getMovimientos } from "@/services/apis/tesoreria";
import { formatMonto, TIPO_ICONS, TIPO_COLORS, MONEDA_CONFIG } from "./helpers";
import TransferenciaForm from "./TransferenciaForm";
import MovimientosTable from "./MovimientosTable";

export default function CuentasTab() {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [form, setForm] = useState({
    nombre: "", tipo: "banco", entidad_bancaria: "",
    numero_cuenta: "", moneda_principal: "PYG",
    saldo_inicial: "", descripcion: "",
  });

  const { data, loading, execute: fetchCuentas } = useApi(getCuentas, {
    auto: true, initialData: { results: [] },
  });
  const cuentas = data?.results || data || [];

  // Agrupar cuentas por moneda_principal
  const cuentasPorMoneda = cuentas.reduce((acc, cuenta) => {
    const moneda = cuenta.moneda_principal || "PYG";
    if (!acc[moneda]) acc[moneda] = [];
    acc[moneda].push(cuenta);
    return acc;
  }, {});

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.tipo) return;
    try {
      await createCuenta({
        ...form,
        saldo_inicial: form.saldo_inicial || 0,
      });
      showToast("Cuenta creada exitosamente.", "success");
      setShowForm(false);
      setForm({ nombre: "", tipo: "banco", entidad_bancaria: "", numero_cuenta: "", moneda_principal: "PYG", saldo_inicial: "", descripcion: "" });
      fetchCuentas();
    } catch (err) {
      showToast(err?.data?.detail || err?.message || "Error al crear.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Acciones */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Resumen por Moneda</h2>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" icon={ArrowRight} onClick={() => setShowTransferencia(true)}
            className="bg-purple-600 hover:bg-purple-700">
            Transferir
          </Button>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setShowForm(true)}>
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Resumen por moneda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["PYG", "USD", "BRL"].map((moneda) => {
          const config = MONEDA_CONFIG[moneda];
          const cuentasMoneda = cuentasPorMoneda[moneda] || [];
          const saldoTotal = cuentasMoneda.reduce(
            (acc, c) => acc + Number(c.saldo || 0), 0
          );
          return (
            <div key={moneda} className={cn("border rounded-2xl p-5", config.color)}>
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold", config.iconColor)}>
                  {config.symbol}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-700">{config.label}</p>
                  <p className="text-[10px] text-slate-400">{cuentasMoneda.length} cuenta{cuentasMoneda.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <p className={cn("text-xl font-black", config.textColor)}>
                {formatMonto(saldoTotal, moneda)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Formulario transferencia */}
      {showTransferencia && (
        <TransferenciaForm
          cuentas={cuentas}
          onClose={() => setShowTransferencia(false)}
          onSuccess={() => { fetchCuentas(); setShowTransferencia(false); }}
        />
      )}

      {/* Formulario nueva cuenta */}
      {showForm && (
        <div className="bg-white border border-purple-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Nueva Cuenta Financiera</h3>
          <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nombre *">
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Banco Itaú Cta. Cte." />
            </Field>
            <Field label="Tipo *">
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="tesoreria">Tesorería (efectivo)</option>
                <option value="banco">Cuenta Bancaria</option>
              </select>
            </Field>
            <Field label="Moneda Principal">
              <select value={form.moneda_principal} onChange={(e) => setForm({ ...form, moneda_principal: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="PYG">Guaraní (PYG)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="BRL">Real (BRL)</option>
              </select>
            </Field>
            {form.tipo === "banco" && (
              <>
                <Field label="Entidad Bancaria">
                  <Input value={form.entidad_bancaria} onChange={(e) => setForm({ ...form, entidad_bancaria: e.target.value })} placeholder="Banco Itaú" />
                </Field>
                <Field label="Nro. Cuenta">
                  <Input value={form.numero_cuenta} onChange={(e) => setForm({ ...form, numero_cuenta: e.target.value })} placeholder="0123456789" />
                </Field>
              </>
            )}
            <Field label="Saldo Inicial">
              <MontoInput
                value={form.saldo_inicial}
                onChange={(val) => setForm({ ...form, saldo_inicial: val })}
                moneda={form.moneda_principal}
              />
            </Field>
            <div className="col-span-full flex gap-2 justify-end">
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button variant="primary" type="submit" icon={Plus} className="bg-purple-600 hover:bg-purple-700">Crear Cuenta</Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de cuentas agrupadas por moneda */}
      {loading ? <LoadingScreen texto="Cargando cuentas..." /> : cuentas.length === 0 ? (
        <EmptyState icon="🏦" titulo="Sin cuentas" descripcion="Creá tu primera cuenta financiera para empezar a registrar movimientos." />
      ) : (
        <div className="space-y-6">
          {["PYG", "USD", "BRL"].map((moneda) => {
            const cuentasMoneda = cuentasPorMoneda[moneda];
            if (!cuentasMoneda || cuentasMoneda.length === 0) return null;
            const config = MONEDA_CONFIG[moneda];
            return (
              <div key={moneda}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md text-white text-[10px] font-bold", config.iconColor)}>
                    {config.symbol}
                  </span>
                  <h3 className="text-sm font-bold text-slate-700">{config.label}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cuentasMoneda.map((cuenta) => {
                    const Icon = TIPO_ICONS[cuenta.tipo] || Building2;
                    const colorBg = TIPO_COLORS[cuenta.tipo] || "bg-slate-500";
                    const monedaCuenta = cuenta.moneda_principal || moneda;
                    const saldo = Number(cuenta.saldo || 0);
                    return (
                      <Link key={cuenta.id} href={`/tesoreria/${cuenta.id}`} className="block h-full">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 h-full hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex items-start gap-3">
                          <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shrink-0", colorBg)}>
                            <Icon size={20} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{cuenta.nombre}</p>
                            <p className="text-xs text-slate-400">{cuenta.tipo_display}</p>
                            {cuenta.entidad_bancaria && <p className="text-xs text-slate-500 mt-0.5">{cuenta.entidad_bancaria} • {cuenta.numero_cuenta}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn("text-lg font-black", saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                              {formatMonto(saldo, monedaCuenta)}
                            </p>
                            <p className="text-[10px] text-slate-400">Ver detalle →</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Últimos movimientos */}
      {cuentas.length > 0 && <UltimosMovimientos />}
    </div>
  );
}

// ─── Componente interno: Últimos movimientos globales ────────────

function UltimosMovimientos() {
  const { data, loading } = useApi(() => getMovimientos({ page_size: 10 }), {
    auto: true, initialData: { results: [] },
  });
  const movimientos = data?.results || [];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Últimos Movimientos</h2>
      {loading ? <LoadingScreen texto="Cargando..." /> : (
        <MovimientosTable data={movimientos} showCuenta={true} />
      )}
    </div>
  );
}