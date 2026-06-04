"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  FileText, Send, Check, X, RefreshCw, ExternalLink, Loader2,
} from "lucide-react";
import {
  Button, Badge, Section, Input, SearchBar, EmptyState, LoadingScreen,
  Text,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getPresupuestos,
  createPresupuesto,
  updatePresupuesto,
  enviarPresupuesto,
  aceptarPresupuesto,
  rechazarPresupuesto,
  nuevaVersionPresupuesto,
  buscarProductos,
} from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

// ─── Constantes ─────────────────────────────────────────────────

const ESTADO_BADGE = {
  borrador: { variant: "default", label: "Borrador" },
  enviado: { variant: "info", label: "Enviado" },
  aceptado: { variant: "success", label: "Aceptado" },
  rechazado: { variant: "danger", label: "Rechazado" },
  vencido: { variant: "warning", label: "Vencido" },
};

const MONEDA_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "PYG", label: "PYG" },
  { value: "BRL", label: "BRL" },
];

function formatMonto(monto, moneda = "USD") {
  if (!monto || Number(monto) === 0) return "—";
  const num = Number(monto);
  if (moneda === "PYG") return num.toLocaleString("es-PY") + " ₲";
  return "USD " + num.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function formatPrecio(valor) {
  if (!valor || valor === "0" || valor === "None") return "—";
  return `$${Number(valor).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Componente Principal ───────────────────────────────────────

export default function PresupuestoSection({ oportunidadId, etapa, onGanada }) {
  const { showToast } = useToast();
  const { data: presupuestosData, loading, execute: fetchPresupuestos } =
    useApi(getPresupuestos);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (oportunidadId) {
      fetchPresupuestos({ oportunidad: oportunidadId });
    }
  }, [oportunidadId, fetchPresupuestos]);

  const presupuestos = presupuestosData?.results || [];

  // Acciones
  const handleEnviar = async (id) => {
    setActionLoading(`enviar-${id}`);
    try {
      await enviarPresupuesto(id);
      showToast("Presupuesto enviado al cliente", "success");
      fetchPresupuestos({ oportunidad: oportunidadId });
    } catch (err) {
      showToast(err?.data?.detail || "Error al enviar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAceptar = async (id) => {
    setActionLoading(`aceptar-${id}`);
    try {
      await aceptarPresupuesto(id);
      showToast("Presupuesto aceptado. Venta generada.", "success");
      fetchPresupuestos({ oportunidad: oportunidadId });
      onGanada?.();
    } catch (err) {
      showToast(err?.data?.detail || "Error al aceptar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazar = async (id) => {
    const motivo = prompt("Motivo de rechazo (opcional):");
    if (motivo === null) return;
    setActionLoading(`rechazar-${id}`);
    try {
      await rechazarPresupuesto(id, { motivo });
      showToast("Presupuesto rechazado", "warning");
      fetchPresupuestos({ oportunidad: oportunidadId });
    } catch (err) {
      showToast(err?.data?.detail || "Error al rechazar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNuevaVersion = async (id) => {
    setActionLoading(`version-${id}`);
    try {
      await nuevaVersionPresupuesto(id);
      showToast("Nueva versión creada", "success");
      fetchPresupuestos({ oportunidad: oportunidadId });
    } catch (err) {
      showToast(err?.data?.detail || "Error al crear versión", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // No mostrar si no estamos en negociación o posterior
  const etapasConPresupuesto = ["negociacion", "ganada", "perdida"];
  if (!etapasConPresupuesto.includes(etapa)) return null;

  // En negociación: buscar si hay un borrador activo
  const borradorActivo = presupuestos.find((p) => p.estado === "borrador");
  const presupuestosNoEditables = presupuestos.filter((p) => p.estado !== "borrador");

  return (
    <>
      {/* Constructor de presupuesto (solo en negociación) */}
      {etapa === "negociacion" && (
        <ConstructorPresupuesto
          oportunidadId={oportunidadId}
          presupuestoBorrador={borradorActivo}
          onCreated={() => fetchPresupuestos({ oportunidad: oportunidadId })}
          onEnviar={handleEnviar}
        />
      )}

      {/* Presupuestos enviados/aceptados/rechazados */}
      {presupuestosNoEditables.length > 0 && (
        <Section
          title="Presupuestos anteriores"
          action={
            <Badge variant="default" className="text-[10px]">
              {presupuestosNoEditables.length} versión{presupuestosNoEditables.length !== 1 ? "es" : ""}
            </Badge>
          }
        >
          <div className="p-6 space-y-4">
            {presupuestosNoEditables.map((presupuesto) => (
              <PresupuestoCard
                key={presupuesto.id}
                presupuesto={presupuesto}
                actionLoading={actionLoading}
                onEnviar={handleEnviar}
                onAceptar={handleAceptar}
                onRechazar={handleRechazar}
                onNuevaVersion={handleNuevaVersion}
              />
            ))}
          </div>
        </Section>
      )}

      {/* En etapas cerradas, mostrar todo como cards */}
      {etapa !== "negociacion" && presupuestos.length > 0 && presupuestosNoEditables.length === 0 && (
        <Section
          title="Presupuestos"
          action={
            <Badge variant="default" className="text-[10px]">
              {presupuestos.length} versión{presupuestos.length !== 1 ? "es" : ""}
            </Badge>
          }
        >
          <div className="p-6 space-y-4">
            {presupuestos.map((presupuesto) => (
              <PresupuestoCard
                key={presupuesto.id}
                presupuesto={presupuesto}
                actionLoading={actionLoading}
                onEnviar={handleEnviar}
                onAceptar={handleAceptar}
                onRechazar={handleRechazar}
                onNuevaVersion={handleNuevaVersion}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Mensaje vacío para etapas cerradas sin presupuestos */}
      {etapa !== "negociacion" && presupuestos.length === 0 && !loading && (
        <Section title="Presupuestos">
          <div className="p-6 text-center">
            <Text variant="muted">No hay presupuestos asociados.</Text>
          </div>
        </Section>
      )}
    </>
  );
}

// ─── Constructor de Presupuesto (tabla interactiva) ─────────────

function ConstructorPresupuesto({ oportunidadId, presupuestoBorrador, onCreated, onEnviar }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [moneda, setMoneda] = useState(presupuestoBorrador?.moneda || "USD");
  const [lineas, setLineas] = useState([]);

  // Búsqueda de productos
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebounce(busqueda, 400);
  const { data: searchResults, loading: buscando, execute: buscar } = useApi(buscarProductos);

  // Buscar cuando cambia el término
  useEffect(() => {
    if (busquedaDebounced.length >= 2) {
      buscar({ q: busquedaDebounced });
    }
  }, [busquedaDebounced, buscar]);

  // Inicializar líneas desde borrador existente
  useEffect(() => {
    if (presupuestoBorrador?.lineas) {
      setLineas(
        presupuestoBorrador.lineas.map((l) => ({
          variante: l.variante,
          variante_nombre: l.variante_nombre || "",
          variante_sku: l.variante_sku || "",
          producto_nombre: l.producto_nombre || "",
          cantidad: l.cantidad,
          precio_unitario: Number(l.precio_unitario) || 0,
          descuento_porcentaje: Number(l.descuento_porcentaje) || 0,
        }))
      );
      setMoneda(presupuestoBorrador.moneda || "USD");
    }
  }, [presupuestoBorrador]);

  // ─── Resultados normalizados ────────────────────────────────

  const resultadosNormalizados = useMemo(() => {
    if (busquedaDebounced.length < 2) return [];
    const raw = searchResults?.results || searchResults || [];
    return raw.map((v) => ({
      id: v.id,
      product_code: v.product_code || "",
      nombre_variante: v.nombre_variante || "",
      producto_nombre: v.producto_nombre || "",
      precio_0_publico: v.precio_0_publico,
      precio_1_estudiante: v.precio_1_estudiante,
      precio_2_reventa: v.precio_2_reventa,
    }));
  }, [busquedaDebounced, searchResults]);

  // ─── IDs seleccionados ──────────────────────────────────────

  const selectedIds = useMemo(
    () => new Set(lineas.map((l) => l.variante)),
    [lineas]
  );

  // ─── Filas de tabla: seleccionados primero ──────────────────

  const filasTabla = useMemo(() => {
    const seleccionados = lineas.map((l) => ({
      id: l.variante,
      product_code: l.variante_sku,
      nombre_variante: l.variante_nombre,
      producto_nombre: l.producto_nombre,
      precio_0_publico: l.precio_unitario || null,
      precio_1_estudiante: null,
      precio_2_reventa: null,
    }));

    const noSeleccionados = resultadosNormalizados.filter(
      (v) => !selectedIds.has(v.id)
    );

    if (busquedaDebounced.length >= 2) {
      const searchLower = busquedaDebounced.toLowerCase();
      const seleccionadosMatch = seleccionados.filter(
        (s) =>
          s.producto_nombre.toLowerCase().includes(searchLower) ||
          s.nombre_variante.toLowerCase().includes(searchLower) ||
          s.product_code.toLowerCase().includes(searchLower)
      );
      return [...seleccionadosMatch, ...noSeleccionados];
    }

    // Sin búsqueda: solo seleccionados
    return seleccionados;
  }, [lineas, resultadosNormalizados, busquedaDebounced, selectedIds]);

  // ─── Autoguardado ───────────────────────────────────────────

  const saveTimeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  const autoSave = useCallback(
    (nuevasLineas, monedaActual) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        if (nuevasLineas.length === 0) return;

        // Validar que todas las líneas tienen precio
        const lineasValidas = nuevasLineas.filter((l) => l.precio_unitario > 0);
        if (lineasValidas.length === 0) return;

        setSaving(true);
        try {
          const payload = {
            oportunidad: parseInt(oportunidadId, 10),
            moneda: monedaActual,
            lineas: lineasValidas.map((l) => ({
              variante: l.variante,
              cantidad: l.cantidad,
              precio_unitario: l.precio_unitario,
              descuento_porcentaje: l.descuento_porcentaje || 0,
            })),
          };

          if (presupuestoBorrador) {
            await updatePresupuesto(presupuestoBorrador.id, payload);
          } else {
            await createPresupuesto(payload);
            onCreated?.();
          }
        } catch (err) {
          // Silenciar — mostramos error solo si es importante
          const detail = err?.data?.detail || err?.data?.lineas;
          if (detail) {
            showToast(typeof detail === "string" ? detail : "Error al guardar presupuesto", "error");
          }
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [oportunidadId, presupuestoBorrador, onCreated, showToast]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    autoSave(lineas, moneda);
  }, [lineas, moneda]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ─── Handlers ───────────────────────────────────────────────

  const handleToggle = (fila) => {
    if (selectedIds.has(fila.id)) {
      setLineas((prev) => prev.filter((l) => l.variante !== fila.id));
    } else {
      // Usar precio público como default
      const precioDefault = Number(fila.precio_0_publico) || 0;
      setLineas((prev) => [
        ...prev,
        {
          variante: fila.id,
          variante_nombre: fila.nombre_variante || "",
          variante_sku: fila.product_code || "",
          producto_nombre: fila.producto_nombre || "",
          cantidad: 1,
          precio_unitario: precioDefault,
          descuento_porcentaje: 0,
        },
      ]);
    }
  };

  const handleCantidad = (varianteId, cantidad) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.variante === varianteId
          ? { ...l, cantidad: Math.max(1, Number(cantidad) || 1) }
          : l
      )
    );
  };

  const handlePrecio = (varianteId, precio) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.variante === varianteId
          ? { ...l, precio_unitario: Number(precio) || 0 }
          : l
      )
    );
  };

  const handleDescuento = (varianteId, descuento) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.variante === varianteId
          ? { ...l, descuento_porcentaje: Math.min(100, Math.max(0, Number(descuento) || 0)) }
          : l
      )
    );
  };

  // ─── Cálculos ───────────────────────────────────────────────

  const total = useMemo(() => {
    return lineas.reduce((sum, l) => {
      const subtotal = l.cantidad * l.precio_unitario * (1 - l.descuento_porcentaje / 100);
      return sum + subtotal;
    }, 0);
  }, [lineas]);

  const isLoading = buscando;

  return (
    <Section
      title="Armar Presupuesto"
      action={
        <div className="flex items-center gap-3">
          <Text variant="label" className="flex items-center gap-1.5 text-slate-400">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              saving
                ? "bg-amber-400 animate-pulse"
                : lineas.length > 0
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                  : "bg-slate-300"
            )} />
            {saving ? "Guardando..." : `${lineas.length} producto${lineas.length !== 1 ? "s" : ""}`}
          </Text>
          {presupuestoBorrador && lineas.length > 0 && (
            <Button
              variant="primary"
              size="xs"
              icon={Send}
              onClick={() => onEnviar(presupuestoBorrador.id)}
              disabled={saving || total === 0}
            >
              Enviar
            </Button>
          )}
        </div>
      }
    >
      <div className="p-5 space-y-4">
        {/* Moneda selector */}
        <div className="flex items-center gap-3">
          <Text variant="label" className="text-slate-500">Moneda:</Text>
          <div className="flex gap-1">
            {MONEDA_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMoneda(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer",
                  moneda === opt.value
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                    : "bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-600 hover:border-slate-300"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {total > 0 && (
            <div className="ml-auto">
              <Text variant="label" className="text-slate-400 mr-2">Total:</Text>
              <span className="text-base font-bold text-slate-800">
                {formatMonto(total, moneda)}
              </span>
            </div>
          )}
        </div>

        {/* Buscador */}
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar código, nombre, marca..."
        />

        {busqueda.length > 0 && busqueda.length < 2 && (
          <Text variant="muted" className="text-center text-[11px]">
            Escribí al menos 2 caracteres para filtrar.
          </Text>
        )}

        {/* Tabla */}
        {filasTabla.length > 0 ? (
          <div className={cn(
            "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-opacity duration-200",
            isLoading && "opacity-50 pointer-events-none"
          )}>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 pl-4 pr-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-11"></th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[120px]">SKU</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[80px]">Ref. Púb.</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-[70px]">Cant.</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[100px]">Precio Unit.</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-[70px]">Desc.%</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[90px]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filasTabla.map((fila) => {
                    const selected = selectedIds.has(fila.id);
                    const linea = lineas.find((l) => l.variante === fila.id);
                    const subtotal = linea
                      ? linea.cantidad * linea.precio_unitario * (1 - linea.descuento_porcentaje / 100)
                      : 0;

                    return (
                      <tr
                        key={fila.id}
                        onClick={() => handleToggle(fila)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          selected
                            ? "bg-emerald-50/60 hover:bg-emerald-100/60"
                            : "hover:bg-blue-50/40"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 pl-4 pr-2">
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                            selected
                              ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
                              : "border-slate-300 bg-white group-hover:border-emerald-300"
                          )}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </td>
                        {/* SKU */}
                        <td className="py-2.5 px-3">
                          <Badge className="font-mono text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                            {fila.product_code || "—"}
                          </Badge>
                        </td>
                        {/* Producto */}
                        <td className="py-2.5 px-3">
                          <Text variant="bodyXs" className="font-black text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
                            {fila.producto_nombre}
                          </Text>
                          {fila.nombre_variante && (
                            <Text variant="bodyXs" className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate mt-0.5">
                              {fila.nombre_variante}
                            </Text>
                          )}
                        </td>
                        {/* Precio de referencia */}
                        <td className="py-2.5 px-3 text-right">
                          <Text variant="bodyXs" className="text-slate-400">
                            {!selected ? formatPrecio(fila.precio_0_publico) : ""}
                          </Text>
                        </td>
                        {/* Cantidad */}
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {selected ? (
                            <Input
                              type="number"
                              min="1"
                              value={linea?.cantidad || 1}
                              onChange={(e) => handleCantidad(fila.id, e.target.value)}
                              className="w-16 text-center text-xs font-black !py-1 !px-1 !rounded-lg !border-emerald-200 !bg-emerald-50"
                              fullWidth={false}
                            />
                          ) : (
                            <Text variant="muted" className="text-xs">—</Text>
                          )}
                        </td>
                        {/* Precio unitario */}
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {selected ? (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={linea?.precio_unitario || ""}
                              onChange={(e) => handlePrecio(fila.id, e.target.value)}
                              className="w-20 text-right text-xs font-black !py-1 !px-1.5 !rounded-lg !border-blue-200 !bg-blue-50"
                              fullWidth={false}
                            />
                          ) : (
                            <Text variant="bodyXs" className="font-black text-slate-800">
                              {formatPrecio(fila.precio_0_publico)}
                            </Text>
                          )}
                        </td>
                        {/* Descuento */}
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {selected ? (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={linea?.descuento_porcentaje || 0}
                              onChange={(e) => handleDescuento(fila.id, e.target.value)}
                              className="w-16 text-center text-xs font-semibold !py-1 !px-1 !rounded-lg"
                              fullWidth={false}
                            />
                          ) : (
                            <Text variant="muted" className="text-xs">—</Text>
                          )}
                        </td>
                        {/* Subtotal */}
                        <td className="py-2.5 px-3 text-right">
                          {selected && subtotal > 0 ? (
                            <span className="text-xs font-bold text-slate-800">
                              {formatPrecio(subtotal)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer con total */}
            {lineas.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200">
                <Text variant="label" className="text-slate-400">
                  {lineas.length} línea{lineas.length !== 1 ? "s" : ""}
                </Text>
                <div className="flex items-center gap-2">
                  <Text variant="label" className="text-slate-500">Total:</Text>
                  <span className="text-lg font-bold text-slate-900">
                    {formatMonto(total, moneda)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <LoadingScreen texto="Buscando productos..." />
        ) : busquedaDebounced.length >= 2 ? (
          <EmptyState
            titulo="Sin resultados"
            descripcion={`No se encontraron productos para "${busquedaDebounced}"`}
          />
        ) : null}
      </div>
    </Section>
  );
}

// ─── Card de Presupuesto (no editable) ──────────────────────────

function PresupuestoCard({
  presupuesto,
  actionLoading,
  onEnviar,
  onAceptar,
  onRechazar,
  onNuevaVersion,
}) {
  const { id, version, estado, moneda, total, lineas, venta_id, created_at, vigencia_dias } =
    presupuesto;

  const estadoBadge = ESTADO_BADGE[estado] || ESTADO_BADGE.borrador;
  const isLoading = actionLoading && actionLoading.includes(String(id));

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-slate-400" />
          <Text variant="bodySmBold" as="span">
            Versión {version}
          </Text>
          <Badge variant={estadoBadge.variant} className="text-[10px]">
            {estadoBadge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Text variant="mutedXs" as="span">
            {new Date(created_at).toLocaleDateString("es-PY")}
          </Text>
          {vigencia_dias && estado === "enviado" && (
            <Text variant="mutedXs" as="span">
              · {vigencia_dias} días vigencia
            </Text>
          )}
        </div>
      </div>

      {/* Líneas */}
      {lineas && lineas.length > 0 && (
        <div className="px-4 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide">
                <th className="pb-2 font-bold">Producto</th>
                <th className="pb-2 font-bold text-center">Cant.</th>
                <th className="pb-2 font-bold text-right">P. Unit.</th>
                <th className="pb-2 font-bold text-right">Desc.</th>
                <th className="pb-2 font-bold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <tr key={linea.id} className="border-t border-slate-50">
                  <td className="py-2">
                    <span className="text-slate-700 font-medium">
                      {linea.producto_nombre}
                    </span>
                    {linea.variante_nombre && (
                      <span className="text-slate-400 ml-1">
                        — {linea.variante_nombre}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-center text-slate-600">
                    {linea.cantidad}
                  </td>
                  <td className="py-2 text-right font-mono text-slate-600">
                    {formatMonto(linea.precio_unitario, moneda)}
                  </td>
                  <td className="py-2 text-right text-slate-500">
                    {Number(linea.descuento_porcentaje) > 0
                      ? `${linea.descuento_porcentaje}%`
                      : "—"}
                  </td>
                  <td className="py-2 text-right font-mono font-semibold text-slate-700">
                    {formatMonto(linea.subtotal, moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: total + acciones */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-t border-slate-100">
        <div>
          <Text variant="mutedXs" as="span" className="mr-2">
            Total:
          </Text>
          <span className="text-base font-bold text-slate-800">
            {formatMonto(total, moneda)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {estado === "borrador" && (
            <Button
              variant="primary"
              size="xs"
              icon={isLoading ? Loader2 : Send}
              onClick={() => onEnviar(id)}
              disabled={!!actionLoading || Number(total) === 0}
              className={isLoading ? "[&_svg]:animate-spin" : ""}
            >
              Enviar
            </Button>
          )}

          {estado === "enviado" && (
            <>
              <Button
                variant="success"
                size="xs"
                icon={isLoading ? Loader2 : Check}
                onClick={() => onAceptar(id)}
                disabled={!!actionLoading}
                className={isLoading ? "[&_svg]:animate-spin" : ""}
              >
                Aceptar
              </Button>
              <Button
                variant="danger"
                size="xs"
                icon={X}
                onClick={() => onRechazar(id)}
                disabled={!!actionLoading}
              >
                Rechazar
              </Button>
            </>
          )}

          {(estado === "rechazado" || estado === "vencido") && (
            <Button
              variant="secondary"
              size="xs"
              icon={isLoading ? Loader2 : RefreshCw}
              onClick={() => onNuevaVersion(id)}
              disabled={!!actionLoading}
              className={isLoading ? "[&_svg]:animate-spin" : ""}
            >
              Nueva versión
            </Button>
          )}

          {estado === "aceptado" && venta_id && (
            <a
              href={`/ventas-crm/ventas/${venta_id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver venta generada
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
