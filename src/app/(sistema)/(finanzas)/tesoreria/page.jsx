"use client";

import { useState, useEffect } from "react";
import {
  Building2, ArrowUpDown, FileCheck, Wallet, Plus, ArrowRight,
  TrendingUp, TrendingDown, RefreshCw, Landmark, Banknote,
} from "lucide-react";
import {
  PageHeader, Button, Badge, Section, LoadingScreen, EmptyState,
  Input, Field, Modal, Pagination, useToast,
} from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  getCuentas, createCuenta, getMovimientos, registrarMovimiento,
  transferirEntreCuentas, getChequesTesoreria,
} from "@/services/apis/tesoreria";

// ─── Helpers ────────────────────────────────────────────────────

function formatUSD(v) {
  if (v == null) return "—";
  return `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const TIPO_ICONS = {
  tesoreria: Banknote,
  banco: Landmark,
  cheques_recibidos: FileCheck,
  cheques_emitidos: FileCheck,
};

const TIPO_COLORS = {
  tesoreria: "bg-emerald-500",
  banco: "bg-blue-500",
  cheques_recibidos: "bg-amber-500",
  cheques_emitidos: "bg-purple-500",
};

const TABS = [
  { id: "cuentas", label: "Cuentas", icon: Building2 },
  { id: "movimientos", label: "Movimientos", icon: ArrowUpDown },
  { id: "cheques", label: "Cheques", icon: FileCheck },
  { id: "conciliacion", label: "Conciliación", icon: Wallet },
];

// ─── Page ───────────────────────────────────────────────────────

export default function TesoreriaPage() {
  const [activeTab, setActiveTab] = useState("cuentas");

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Tesorería" }]}
        subtitle="Gestión de cuentas financieras, movimientos y conciliación"
        subtitleClassName="text-purple-600"
      />

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-8">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-5xl mx-auto">
          {activeTab === "cuentas" && <CuentasTab />}
          {activeTab === "movimientos" && <MovimientosTab />}
          {activeTab === "cheques" && <ChequesTab />}
          {activeTab === "conciliacion" && <ConciliacionTab />}
        </div>
      </main>
    </div>
  );
}


// ─── Tab: Cuentas ───────────────────────────────────────────────

function CuentasTab() {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "", tipo: "banco", entidad_bancaria: "",
    numero_cuenta: "", moneda_principal: "PYG",
    saldo_inicial_usd: "", descripcion: "",
  });

  const { data, loading, execute: fetchCuentas } = useApi(getCuentas, {
    auto: true, initialData: { results: [] },
  });
  const cuentas = data?.results || data || [];

  const saldoTotal = cuentas.reduce(
    (acc, c) => acc + Number(c.saldo_usd || 0), 0
  );

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.tipo) return;
    try {
      await createCuenta({
        ...form,
        saldo_inicial_usd: form.saldo_inicial_usd || 0,
      });
      showToast("Cuenta creada exitosamente.", "success");
      setShowForm(false);
      setForm({ nombre: "", tipo: "banco", entidad_bancaria: "", numero_cuenta: "", moneda_principal: "PYG", saldo_inicial_usd: "", descripcion: "" });
      fetchCuentas();
    } catch (err) {
      showToast(err?.data?.detail || err?.message || "Error al crear.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de saldo total */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Saldo Total (todas las cuentas)</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{formatUSD(saldoTotal)}</p>
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700">
            Nueva Cuenta
          </Button>
        </div>
      </div>

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
                <option value="cheques_recibidos">Cartera Cheques Recibidos</option>
                <option value="cheques_emitidos">Cartera Cheques Emitidos</option>
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
            <Field label="Saldo Inicial (USD)">
              <Input type="number" step="0.01" value={form.saldo_inicial_usd} onChange={(e) => setForm({ ...form, saldo_inicial_usd: e.target.value })} placeholder="0.00" />
            </Field>
            <div className="col-span-full flex gap-2 justify-end">
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button variant="primary" type="submit" icon={Plus} className="bg-purple-600 hover:bg-purple-700">Crear Cuenta</Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de cuentas */}
      {loading ? <LoadingScreen texto="Cargando cuentas..." /> : cuentas.length === 0 ? (
        <EmptyState icon="🏦" titulo="Sin cuentas" descripcion="Creá tu primera cuenta financiera para empezar a registrar movimientos." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cuentas.map((cuenta) => {
            const Icon = TIPO_ICONS[cuenta.tipo] || Building2;
            const colorBg = TIPO_COLORS[cuenta.tipo] || "bg-slate-500";
            const saldo = Number(cuenta.saldo_usd || 0);
            return (
              <div key={cuenta.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shrink-0", colorBg)}>
                    <Icon size={20} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{cuenta.nombre}</p>
                    <p className="text-xs text-slate-400">{cuenta.tipo_display}</p>
                    {cuenta.entidad_bancaria && <p className="text-xs text-slate-500 mt-0.5">{cuenta.entidad_bancaria} • {cuenta.numero_cuenta}</p>}
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-black", saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {formatUSD(saldo)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">Saldo</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Movimientos ───────────────────────────────────────────

function MovimientosTab() {
  const { showToast } = useToast();
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [filtroCuenta, setFiltroCuenta] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [page, setPage] = useState(1);

  const { data: cuentasData } = useApi(getCuentas, { auto: true, initialData: { results: [] } });
  const cuentas = cuentasData?.results || cuentasData || [];

  const { data, loading, execute: fetchMovimientos } = useApi(getMovimientos, {
    auto: false, initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page };
    if (filtroCuenta) params.cuenta = filtroCuenta;
    if (filtroTipo) params.tipo = filtroTipo;
    fetchMovimientos(params);
  }, [page, filtroCuenta, filtroTipo, fetchMovimientos]);

  const movimientos = data?.results || [];
  const totalCount = data?.count || 0;

  // Formulario de transferencia
  const [transForm, setTransForm] = useState({
    cuenta_origen: "", cuenta_destino: "", monto_original: "",
    moneda_original: "PYG", concepto: "", fecha: new Date().toISOString().split("T")[0],
  });

  const handleTransferir = async (e) => {
    e.preventDefault();
    try {
      await transferirEntreCuentas({
        ...transForm,
        cuenta_origen: Number(transForm.cuenta_origen),
        cuenta_destino: Number(transForm.cuenta_destino),
      });
      showToast("Transferencia registrada.", "success");
      setShowTransferencia(false);
      setTransForm({ cuenta_origen: "", cuenta_destino: "", monto_original: "", moneda_original: "PYG", concepto: "", fecha: new Date().toISOString().split("T")[0] });
      fetchMovimientos({ page });
    } catch (err) {
      showToast(err?.data?.detail || err?.message || "Error.", "error");
    }
  };

  // Formulario de movimiento manual
  const [movForm, setMovForm] = useState({
    cuenta: "", tipo: "ingreso", origen: "otro", monto_original: "",
    moneda_original: "PYG", concepto: "", fecha: new Date().toISOString().split("T")[0],
  });

  const handleRegistrarMov = async (e) => {
    e.preventDefault();
    try {
      await registrarMovimiento({ ...movForm, cuenta: Number(movForm.cuenta) });
      showToast("Movimiento registrado.", "success");
      setShowMovimiento(false);
      setMovForm({ cuenta: "", tipo: "ingreso", origen: "otro", monto_original: "", moneda_original: "PYG", concepto: "", fecha: new Date().toISOString().split("T")[0] });
      fetchMovimientos({ page });
    } catch (err) {
      showToast(err?.data?.detail || err?.message || "Error.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" icon={ArrowRight} onClick={() => setShowTransferencia(true)}
          className="bg-purple-600 hover:bg-purple-700">
          Transferir
        </Button>
        <Button variant="secondary" size="sm" icon={Plus} onClick={() => setShowMovimiento(true)}>
          Movimiento Manual
        </Button>
      </div>

      {/* Form transferencia */}
      {showTransferencia && (
        <div className="bg-white border border-purple-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Transferencia entre Cuentas</h3>
          <form onSubmit={handleTransferir} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Cuenta Origen *">
              <select value={transForm.cuenta_origen} onChange={(e) => setTransForm({ ...transForm, cuenta_origen: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Seleccionar...</option>
                {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Field>
            <Field label="Cuenta Destino *">
              <select value={transForm.cuenta_destino} onChange={(e) => setTransForm({ ...transForm, cuenta_destino: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Seleccionar...</option>
                {cuentas.filter((c) => String(c.id) !== transForm.cuenta_origen).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Field>
            <Field label="Monto *">
              <Input type="number" step="0.01" min="0" value={transForm.monto_original} onChange={(e) => setTransForm({ ...transForm, monto_original: e.target.value })} />
            </Field>
            <Field label="Moneda">
              <select value={transForm.moneda_original} onChange={(e) => setTransForm({ ...transForm, moneda_original: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="PYG">PYG</option><option value="USD">USD</option><option value="BRL">BRL</option>
              </select>
            </Field>
            <Field label="Concepto *">
              <Input value={transForm.concepto} onChange={(e) => setTransForm({ ...transForm, concepto: e.target.value })} placeholder="Depósito bancario" />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={transForm.fecha} onChange={(e) => setTransForm({ ...transForm, fecha: e.target.value })} />
            </Field>
            <div className="col-span-full flex gap-2 justify-end">
              <Button variant="ghost" type="button" onClick={() => setShowTransferencia(false)}>Cancelar</Button>
              <Button variant="primary" type="submit" icon={ArrowRight} className="bg-purple-600 hover:bg-purple-700">Transferir</Button>
            </div>
          </form>
        </div>
      )}

      {/* Form movimiento manual */}
      {showMovimiento && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Movimiento Manual</h3>
          <form onSubmit={handleRegistrarMov} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Cuenta *">
              <select value={movForm.cuenta} onChange={(e) => setMovForm({ ...movForm, cuenta: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Seleccionar...</option>
                {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Field>
            <Field label="Tipo *">
              <select value={movForm.tipo} onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </Field>
            <Field label="Origen">
              <select value={movForm.origen} onChange={(e) => setMovForm({ ...movForm, origen: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="otro">Otro</option>
                <option value="cobro_cliente">Cobro de Cliente</option>
                <option value="deposito_bancario">Depósito Bancario</option>
                <option value="retiro_bancario">Retiro Bancario</option>
              </select>
            </Field>
            <Field label="Monto *">
              <Input type="number" step="0.01" min="0" value={movForm.monto_original} onChange={(e) => setMovForm({ ...movForm, monto_original: e.target.value })} />
            </Field>
            <Field label="Moneda">
              <select value={movForm.moneda_original} onChange={(e) => setMovForm({ ...movForm, moneda_original: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="PYG">PYG</option><option value="USD">USD</option><option value="BRL">BRL</option>
              </select>
            </Field>
            <Field label="Concepto *">
              <Input value={movForm.concepto} onChange={(e) => setMovForm({ ...movForm, concepto: e.target.value })} placeholder="Descripción" />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={movForm.fecha} onChange={(e) => setMovForm({ ...movForm, fecha: e.target.value })} />
            </Field>
            <div className="col-span-full flex gap-2 justify-end">
              <Button variant="ghost" type="button" onClick={() => setShowMovimiento(false)}>Cancelar</Button>
              <Button variant="primary" type="submit" icon={Plus} className="bg-purple-600 hover:bg-purple-700">Registrar</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-slate-500 block mb-1">Cuenta</label>
          <select value={filtroCuenta} onChange={(e) => { setFiltroCuenta(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Todas</option>
            {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="text-xs font-medium text-slate-500 block mb-1">Tipo</label>
          <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>
        </div>
      </div>

      {/* Tabla de movimientos */}
      {loading ? <LoadingScreen texto="Cargando movimientos..." /> : movimientos.length === 0 ? (
        <EmptyState icon="📋" titulo="Sin movimientos" descripcion="No hay movimientos registrados." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Cuenta</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Concepto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Origen</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Monto USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-600">{formatFecha(m.fecha)}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{m.cuenta_nombre}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[250px] truncate">{m.concepto}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.tipo === "ingreso" ? "success" : "danger"} className="text-[10px]">
                        {m.origen_display}
                      </Badge>
                    </td>
                    <td className={cn("px-4 py-3 text-right font-bold", m.tipo === "ingreso" ? "text-emerald-600" : "text-red-600")}>
                      {m.tipo === "ingreso" ? "+" : "-"} {formatUSD(m.monto_usd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && totalCount > 20 && <Pagination count={totalCount} pageSize={20} currentPage={page} onPageChange={setPage} />}
    </div>
  );
}

// ─── Tab: Cheques ───────────────────────────────────────────────

function ChequesTab() {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { data, loading, execute: fetchCheques } = useApi(getChequesTesoreria, {
    auto: false, initialData: { results: [] },
  });

  useEffect(() => {
    const params = {};
    if (filtroTipo) params.tipo_cheque = filtroTipo;
    if (filtroEstado) params.estado = filtroEstado;
    fetchCheques(params);
  }, [filtroTipo, filtroEstado, fetchCheques]);

  const cheques = data?.results || data || [];

  const ESTADO_BADGE = {
    en_cartera: "info", depositado: "warning", acreditado: "success",
    rechazado: "danger", emitido: "warning", cobrado: "success", anulado: "default",
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[140px]">
          <label className="text-xs font-medium text-slate-500 block mb-1">Tipo</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Todos</option>
            <option value="recibido">Recibidos</option>
            <option value="emitido">Emitidos</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-xs font-medium text-slate-500 block mb-1">Estado</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Todos</option>
            <option value="en_cartera">En Cartera</option>
            <option value="depositado">Depositado</option>
            <option value="acreditado">Acreditado</option>
            <option value="rechazado">Rechazado</option>
            <option value="emitido">Emitido</option>
            <option value="cobrado">Cobrado</option>
          </select>
        </div>
      </div>

      {loading ? <LoadingScreen texto="Cargando cheques..." /> : cheques.length === 0 ? (
        <EmptyState icon="📄" titulo="Sin cheques" descripcion="No hay cheques registrados en tesorería." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Nro.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Banco</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">De / Para</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Fecha Cobro</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cheques.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs">{ch.numero_cheque}</td>
                    <td className="px-4 py-3 text-slate-700">{ch.banco_emisor}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {ch.tipo_cheque === "recibido" ? (ch.librador || ch.cliente_nombre || "—") : (ch.beneficiario || ch.proveedor_nombre || "—")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatUSD(ch.monto_usd)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatFecha(ch.fecha_cobro || ch.fecha_emision)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={ESTADO_BADGE[ch.estado] || "default"} className="text-[10px]">{ch.estado}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Conciliación ──────────────────────────────────────────

function ConciliacionTab() {
  const { data: cuentasData } = useApi(getCuentas, { auto: true, initialData: { results: [] } });
  const cuentas = cuentasData?.results || cuentasData || [];

  return (
    <div className="space-y-6">
      <Section title="Conciliación de Cuentas">
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6">
            Compará el saldo que el sistema registra contra el saldo real (extracto bancario o arqueo físico de tesorería).
          </p>

          {cuentas.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay cuentas configuradas.</p>
          ) : (
            <div className="space-y-3">
              {cuentas.map((cuenta) => (
                <div key={cuenta.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-5 py-4 border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{cuenta.nombre}</p>
                    <p className="text-xs text-slate-400">{cuenta.tipo_display}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">Saldo sistema: {formatUSD(cuenta.saldo_usd)}</p>
                    <p className="text-[10px] text-slate-400">Verificar contra extracto/arqueo</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
            <p className="text-xs text-purple-700 font-medium">
              💡 Para registrar diferencias, usá la opción "Movimiento Manual" en la pestaña Movimientos con origen "Ajuste de Conciliación".
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
