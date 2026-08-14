"use client";
import { useState, useEffect } from "react";
import {
  PageHeader,
  Text,
  Heading,
  LoadingScreen,
  Input,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getRendimientoVendedores,
  getMetasResumen,
  crearMeta,
  cancelarMeta,
} from "@/services/apis/comercial";
import {
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Trophy,
  Medal,
  Target,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

const PERIODOS = [
  { id: "semana", label: "Última Semana" },
  { id: "mes", label: "Último Mes" },
  { id: "trimestre", label: "Último Trimestre" },
  { id: "anio", label: "Último Año" },
];

const TABS = [
  { id: "resumen", label: "Resumen y Metas", icon: Target },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "configurar", label: "Configurar Metas", icon: Plus },
];

export default function RendimientoMetasPage() {
  const [tab, setTab] = useState("resumen");
  const [periodo, setPeriodo] = useState("mes");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Rendimiento
  const {
    data: rendimientoData,
    loading: loadingRendimiento,
    execute: fetchRendimiento,
  } = useApi(getRendimientoVendedores, {
    auto: false,
    initialData: { totales: {}, vendedores: [], periodo: {} },
  });

  // Metas
  const {
    data: metasData,
    loading: loadingMetas,
    execute: fetchMetas,
  } = useApi(getMetasResumen, {
    auto: false,
    initialData: [],
  });

  useEffect(() => {
    const params = { periodo };
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    fetchRendimiento(params);
    fetchMetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, fechaDesde, fechaHasta]);

  const totales = rendimientoData?.totales || {};
  const vendedores = rendimientoData?.vendedores || [];
  const metas = Array.isArray(metasData) ? metasData : [];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión Comercial", href: "/gestion-comercial" },
          { label: "Rendimiento y Metas" },
        ]}
        subtitle={
          <>
            <Target size={12} /> Control de vendedores: metas, avance y ranking
          </>
        }
        subtitleClassName="text-emerald-600"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === t.id
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Filtros de período (para ranking y resumen) */}
          {tab !== "configurar" && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {PERIODOS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPeriodo(p.id);
                      setFechaDesde("");
                      setFechaHasta("");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      periodo === p.id && !fechaDesde
                        ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  label="Desde"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
                <Input
                  type="date"
                  label="Hasta"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Content */}
          {tab === "resumen" && (
            <ResumenTab
              totales={totales}
              vendedores={vendedores}
              metas={metas}
              loading={loadingRendimiento || loadingMetas}
            />
          )}
          {tab === "ranking" && (
            <RankingTab
              totales={totales}
              vendedores={vendedores}
              loading={loadingRendimiento}
            />
          )}
          {tab === "configurar" && (
            <ConfigurarMetasTab onCreated={() => fetchMetas()} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Resumen y Metas ──────────────────────────────────────

function ResumenTab({ totales, vendedores, metas, loading }) {
  if (loading) return <LoadingScreen message="Cargando datos..." />;

  return (
    <div className="space-y-6">
      {/* KPIs globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={<ShoppingCart size={22} />}
          label="Total Pedidos"
          value={totales.total_ventas || 0}
        />
        <KpiCard
          icon={<DollarSign size={22} />}
          label="Monto Total"
          value={`$${(totales.monto_total_usd || 0).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <KpiCard
          icon={<Users size={22} />}
          label="Ticket Promedio"
          value={`$${(totales.ticket_promedio || 0).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </div>

      {/* Metas activas con avance */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <Heading level={5} className="text-slate-800">
              Metas Activas
            </Heading>
            <Text variant="bodyXs" className="text-slate-400 mt-1">
              Avance de cada vendedor vs su meta asignada
            </Text>
          </div>
          <Target className="w-5 h-5 text-emerald-500" />
        </div>

        {metas.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <Text className="text-slate-500">
              No hay metas activas configuradas
            </Text>
            <Text variant="bodyXs" className="text-slate-400 mt-1">
              Usá la pestaña &quot;Configurar Metas&quot; para asignar objetivos
            </Text>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {metas.map((meta) => (
              <MetaAvanceRow key={meta.id} meta={meta} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaAvanceRow({ meta }) {
  const porcentaje = meta.porcentaje_avance || 0;
  const cumplida = meta.cumplida;

  const getStatusIcon = () => {
    if (cumplida) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (porcentaje >= 75) return <Clock className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-slate-400" />;
  };

  const getBarColor = () => {
    if (cumplida) return "from-emerald-400 to-emerald-600";
    if (porcentaje >= 75) return "from-amber-400 to-amber-500";
    if (porcentaje >= 50) return "from-blue-400 to-blue-500";
    return "from-slate-300 to-slate-400";
  };

  const getTipoLabel = () => {
    if (meta.tipo_meta === "monto") return "USD";
    if (meta.tipo_meta === "cantidad") return "pedidos";
    return "clientes";
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
      <div className="w-6 shrink-0 flex justify-center">
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Text
            variant="bodySm"
            className="font-semibold text-slate-800 truncate"
          >
            {meta.vendedor_nombre}
          </Text>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {meta.tipo_meta_display}
          </span>
          <span className="text-[10px] text-slate-400">
            {meta.tipo_periodo_display}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getBarColor()} rounded-full transition-all duration-700`}
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
          </div>
          <Text
            variant="bodyXs"
            className={`font-black shrink-0 ${cumplida ? "text-emerald-600" : "text-slate-600"}`}
          >
            {porcentaje.toFixed(1)}%
          </Text>
        </div>
      </div>
      <div className="text-right shrink-0">
        <Text variant="bodyXs" className="text-slate-400">
          Avance
        </Text>
        <Text variant="bodySm" className="font-bold text-slate-700">
          {meta.tipo_meta === "monto"
            ? `$${meta.valor_actual.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`
            : meta.valor_actual}{" "}
          /{" "}
          {meta.tipo_meta === "monto"
            ? `$${meta.valor_objetivo.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`
            : meta.valor_objetivo}{" "}
          {getTipoLabel()}
        </Text>
      </div>
    </div>
  );
}

// ─── Tab: Ranking ──────────────────────────────────────────────

function RankingTab({ totales, vendedores, loading }) {
  if (loading) return <LoadingScreen message="Calculando rendimiento..." />;

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return (
      <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-400">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumen Global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={<ShoppingCart size={22} />}
          label="Total Pedidos"
          value={totales.total_ventas || 0}
        />
        <KpiCard
          icon={<DollarSign size={22} />}
          label="Monto Total"
          value={`$${(totales.monto_total_usd || 0).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <KpiCard
          icon={<Users size={22} />}
          label="Ticket Promedio"
          value={`$${(totales.ticket_promedio || 0).toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <Heading level={5} className="text-slate-800">
            Ranking de Vendedores
          </Heading>
          <Text variant="bodyXs" className="text-slate-400 mt-1">
            Ordenado por monto total vendido en el período seleccionado
          </Text>
        </div>

        {vendedores.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <Text className="text-slate-500">
              No hay ventas registradas en este período
            </Text>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {vendedores.map((v, idx) => {
              const maxMonto = vendedores[0]?.monto_total_usd || 1;
              const porcentaje = (v.monto_total_usd / maxMonto) * 100;

              return (
                <div
                  key={v.vendedor_id}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-8 shrink-0 flex justify-center">
                    {getRankIcon(idx)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text
                      variant="bodySm"
                      className="font-semibold text-slate-800 truncate"
                    >
                      {v.nombre}
                    </Text>
                    <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <Text variant="bodyXs" className="text-slate-400">
                        Pedidos
                      </Text>
                      <Text
                        variant="bodySm"
                        className="font-bold text-slate-700"
                      >
                        {v.total_ventas}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text variant="bodyXs" className="text-slate-400">
                        Ticket Prom.
                      </Text>
                      <Text
                        variant="bodySm"
                        className="font-bold text-slate-700"
                      >
                        ${v.ticket_promedio.toFixed(2)}
                      </Text>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <Text variant="bodyXs" className="text-slate-400">
                        Total USD
                      </Text>
                      <Text
                        variant="bodySm"
                        className="font-black text-emerald-700"
                      >
                        $
                        {v.monto_total_usd.toLocaleString("es-PY", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Configurar Metas ─────────────────────────────────────

function ConfigurarMetasTab({ onCreated }) {
  const [formData, setFormData] = useState({
    vendedor: "",
    tipo_meta: "monto",
    tipo_periodo: "mensual",
    fecha_inicio: "",
    fecha_fin: "",
    valor_objetivo: "",
    descripcion: "",
  });
  const [vendedores, setVendedores] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Metas existentes
  const {
    data: metasExistentes,
    loading: loadingMetas,
    execute: fetchMetas,
  } = useApi(getMetasResumen, {
    auto: true,
    initialData: [],
  });

  // Cargar vendedores
  useEffect(() => {
    async function loadVendedores() {
      try {
        const res = await getRendimientoVendedores({ periodo: "anio" });
        if (res?.vendedores) {
          setVendedores(res.vendedores);
        }
      } catch {
        // silenciar
      }
    }
    loadVendedores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMensaje(null);

    try {
      await crearMeta({
        vendedor: parseInt(formData.vendedor),
        tipo_meta: formData.tipo_meta,
        tipo_periodo: formData.tipo_periodo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        valor_objetivo: formData.valor_objetivo,
        descripcion: formData.descripcion,
      });
      setMensaje({ tipo: "success", texto: "Meta creada correctamente" });
      setFormData({
        vendedor: "",
        tipo_meta: "monto",
        tipo_periodo: "mensual",
        fecha_inicio: "",
        fecha_fin: "",
        valor_objetivo: "",
        descripcion: "",
      });
      fetchMetas();
      onCreated?.();
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err?.message || "Error al crear la meta",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!confirm("¿Cancelar esta meta?")) return;
    try {
      await cancelarMeta(id);
      fetchMetas();
      onCreated?.();
    } catch {
      // silenciar
    }
  };

  const metasActivas = Array.isArray(metasExistentes) ? metasExistentes : [];

  return (
    <div className="space-y-6">
      {/* Formulario de creación */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <Heading level={5} className="text-slate-800 mb-4">
          Asignar Nueva Meta
        </Heading>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vendedor */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Vendedor
              </label>
              <select
                value={formData.vendedor}
                onChange={(e) =>
                  setFormData({ ...formData, vendedor: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              >
                <option value="">Seleccionar...</option>
                {vendedores.map((v) => (
                  <option key={v.vendedor_id} value={v.vendedor_id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de meta */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tipo de Meta
              </label>
              <select
                value={formData.tipo_meta}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_meta: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              >
                <option value="monto">Monto de Ventas (USD)</option>
                <option value="cantidad">Cantidad de Pedidos</option>
                <option value="clientes_nuevos">Clientes Nuevos</option>
              </select>
            </div>

            {/* Período */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tipo de Período
              </label>
              <select
                value={formData.tipo_periodo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_periodo: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              >
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              label="Fecha Inicio"
              value={formData.fecha_inicio}
              onChange={(e) =>
                setFormData({ ...formData, fecha_inicio: e.target.value })
              }
              required
            />
            <Input
              type="date"
              label="Fecha Fin"
              value={formData.fecha_fin}
              onChange={(e) =>
                setFormData({ ...formData, fecha_fin: e.target.value })
              }
              required
            />
            <Input
              type="number"
              label={
                formData.tipo_meta === "monto"
                  ? "Objetivo (USD)"
                  : "Objetivo (cantidad)"
              }
              value={formData.valor_objetivo}
              onChange={(e) =>
                setFormData({ ...formData, valor_objetivo: e.target.value })
              }
              required
              min="1"
              step={formData.tipo_meta === "monto" ? "0.01" : "1"}
            />
          </div>

          <div>
            <Input
              label="Descripción (opcional)"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Ej: Meta mensual agosto 2026"
            />
          </div>

          {mensaje && (
            <div
              className={`p-3 rounded-xl text-sm font-medium ${
                mensaje.tipo === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {mensaje.texto}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            {submitting ? "Creando..." : "Crear Meta"}
          </button>
        </form>
      </div>

      {/* Lista de metas activas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <Heading level={5} className="text-slate-800">
            Metas Configuradas
          </Heading>
          <Text variant="bodyXs" className="text-slate-400 mt-1">
            Metas vigentes actualmente asignadas
          </Text>
        </div>

        {loadingMetas ? (
          <LoadingScreen message="Cargando metas..." />
        ) : metasActivas.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <Text className="text-slate-500">
              No hay metas configuradas actualmente
            </Text>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {metasActivas.map((meta) => (
              <div
                key={meta.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Text
                      variant="bodySm"
                      className="font-semibold text-slate-800"
                    >
                      {meta.vendedor_nombre}
                    </Text>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                      {meta.tipo_meta_display}
                    </span>
                  </div>
                  <Text variant="bodyXs" className="text-slate-400">
                    {meta.fecha_inicio} → {meta.fecha_fin} ·{" "}
                    {meta.tipo_periodo_display} · Objetivo:{" "}
                    {meta.tipo_meta === "monto"
                      ? `$${meta.valor_objetivo.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`
                      : meta.valor_objetivo}
                  </Text>
                </div>
                <div className="text-right shrink-0 mr-2">
                  <Text
                    variant="bodySm"
                    className={`font-black ${meta.cumplida ? "text-emerald-600" : "text-slate-600"}`}
                  >
                    {meta.porcentaje_avance.toFixed(1)}%
                  </Text>
                </div>
                <button
                  onClick={() => handleCancelar(meta.id)}
                  className="shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Cancelar meta"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componente KPI ────────────────────────────────────────────

function KpiCard({ icon, label, value }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <Text variant="label" className="text-slate-400">
          {label}
        </Text>
        <Heading level={3} className="leading-none">
          {value}
        </Heading>
      </div>
    </div>
  );
}
