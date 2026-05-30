"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Plus, ShoppingCart, MapPin, User, X } from "lucide-react";
import { Button, Input, Field, Section, Badge } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { buscarProductos, getClientes } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";
import LineaVentaRow from "./LineaVentaRow";
import TipoCambioWidget from "./TipoCambioWidget";

// ─── Constantes ─────────────────────────────────────────────────

const ORIGENES = [
  { value: "sucursal", label: "Sucursal", icon: MapPin },
  { value: "campo", label: "Campo", icon: MapPin },
];

const MONEDAS = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "PYG", label: "PYG (₲)", symbol: "₲" },
  { value: "BRL", label: "BRL (R$)", symbol: "R$" },
];

const TIER_PRECIO_FIELD_MAP = {
  publico: "precio_0_publico",
  estudiante: "precio_1_estudiante",
  reventa: "precio_2_reventa",
  mayorista: "precio_3_mayorista",
  intercompany: "precio_4_intercompany",
};

const TIER_LABELS = {
  publico: "Público",
  estudiante: "Estudiante",
  reventa: "Reventa",
  mayorista: "Mayorista",
  intercompany: "Intercompany",
};

const selectClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700";

// ─── Componente Principal ───────────────────────────────────────

/**
 * Constructor de venta: permite seleccionar origen, cliente, buscar productos
 * y agregar líneas de venta con cálculo de precios según tier y moneda.
 *
 * @param {Object} ventaData - Estado actual de la venta
 * @param {Function} onVentaChange - Callback para actualizar datos de la venta
 * @param {Array} lineas - Array de líneas de venta
 * @param {Function} onLineasChange - Callback para actualizar líneas
 */
export default function VentaBuilder({
  ventaData,
  onVentaChange,
  lineas,
  onLineasChange,
}) {
  // ─── Estado de búsqueda de productos ────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebounce(busqueda, 400);
  const [resultados, setResultados] = useState([]);
  const [showResultados, setShowResultados] = useState(false);
  const searchRef = useRef(null);

  const { execute: fetchProductos, loading: buscando } = useApi(buscarProductos);

  // ─── Estado de búsqueda de clientes ─────────────────────────
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const busquedaClienteDebounced = useDebounce(busquedaCliente, 400);
  const [clientesResultados, setClientesResultados] = useState([]);
  const [showClientes, setShowClientes] = useState(false);
  const clienteRef = useRef(null);

  const { execute: fetchClientes, loading: buscandoClientes } = useApi(getClientes);

  // ─── Tipo de cambio ─────────────────────────────────────────
  const [tipoCambio, setTipoCambio] = useState(null);

  // ─── Tier de precio activo ──────────────────────────────────
  const tier = ventaData.cliente?.tier_precio || "publico";

  // ─── Buscar productos cuando cambia el texto ────────────────
  useEffect(() => {
    if (busquedaDebounced && busquedaDebounced.length >= 2) {
      fetchProductos({ q: busquedaDebounced })
        .then((data) => {
          setResultados(Array.isArray(data) ? data : []);
          setShowResultados(true);
        })
        .catch(() => setResultados([]));
    } else if (resultados.length > 0 || showResultados) {
      setResultados([]);
      setShowResultados(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaDebounced]);

  // ─── Buscar clientes cuando cambia el texto ─────────────────
  useEffect(() => {
    if (busquedaClienteDebounced && busquedaClienteDebounced.length >= 2) {
      fetchClientes({ search: busquedaClienteDebounced })
        .then((data) => {
          const results = data?.results || data || [];
          setClientesResultados(Array.isArray(results) ? results : []);
          setShowClientes(true);
        })
        .catch(() => setClientesResultados([]));
    } else if (clientesResultados.length > 0 || showClientes) {
      setClientesResultados([]);
      setShowClientes(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaClienteDebounced]);

  // ─── Cerrar dropdowns al hacer click fuera ──────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResultados(false);
      }
      if (clienteRef.current && !clienteRef.current.contains(e.target)) {
        setShowClientes(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Calcular precio según tier y moneda ────────────────────
  const calcularPrecio = (variante) => {
    const precioField = TIER_PRECIO_FIELD_MAP[tier] || "precio_0_publico";
    const precioUsd = parseFloat(variante[precioField]) || 0;

    let precioMoneda = precioUsd;
    if (ventaData.moneda_negociacion !== "USD" && tipoCambio) {
      precioMoneda = Math.round(precioUsd * parseFloat(tipoCambio.valor));
    }

    return { precioUsd, precioMoneda };
  };

  // ─── Agregar producto a las líneas ──────────────────────────
  const agregarProducto = (variante) => {
    // Verificar si ya existe en las líneas
    const existente = lineas.findIndex((l) => l.variante_id === variante.id);
    if (existente >= 0) {
      // Incrementar cantidad
      const nuevasLineas = [...lineas];
      nuevasLineas[existente] = {
        ...nuevasLineas[existente],
        cantidad: nuevasLineas[existente].cantidad + 1,
        subtotal_usd:
          nuevasLineas[existente].precio_usd *
          (nuevasLineas[existente].cantidad + 1),
        subtotal_moneda:
          nuevasLineas[existente].precio_moneda *
          (nuevasLineas[existente].cantidad + 1),
      };
      onLineasChange(nuevasLineas);
    } else {
      // Agregar nueva línea
      const { precioUsd, precioMoneda } = calcularPrecio(variante);
      const nuevaLinea = {
        variante_id: variante.id,
        product_code: variante.product_code,
        nombre: variante.nombre_variante || variante.producto_nombre,
        cantidad: 1,
        precio_usd: precioUsd,
        precio_moneda: precioMoneda,
        subtotal_usd: precioUsd,
        subtotal_moneda: precioMoneda,
      };
      onLineasChange([...lineas, nuevaLinea]);
    }

    setBusqueda("");
    setShowResultados(false);
  };

  // ─── Cambiar cantidad de una línea ──────────────────────────
  const handleCantidadChange = (index, nuevaCantidad) => {
    const nuevasLineas = [...lineas];
    nuevasLineas[index] = {
      ...nuevasLineas[index],
      cantidad: nuevaCantidad,
      subtotal_usd: nuevasLineas[index].precio_usd * nuevaCantidad,
      subtotal_moneda: nuevasLineas[index].precio_moneda * nuevaCantidad,
    };
    onLineasChange(nuevasLineas);
  };

  // ─── Eliminar línea ─────────────────────────────────────────
  const handleRemoveLinea = (index) => {
    onLineasChange(lineas.filter((_, i) => i !== index));
  };

  // ─── Seleccionar cliente ────────────────────────────────────
  const seleccionarCliente = (cliente) => {
    onVentaChange({ ...ventaData, cliente });
    setBusquedaCliente("");
    setShowClientes(false);
  };

  // ─── Quitar cliente ─────────────────────────────────────────
  const quitarCliente = () => {
    onVentaChange({ ...ventaData, cliente: null });
  };

  // ─── Recalcular precios cuando cambia moneda o TC ────────────
  useEffect(() => {
    if (lineas.length === 0) return;

    const nuevasLineas = lineas.map((linea) => {
      let precioMoneda = linea.precio_usd;
      if (ventaData.moneda_negociacion !== "USD" && tipoCambio) {
        precioMoneda = Math.round(
          linea.precio_usd * parseFloat(tipoCambio.valor)
        );
      }

      return {
        ...linea,
        precio_moneda: precioMoneda,
        subtotal_moneda: precioMoneda * linea.cantidad,
      };
    });

    onLineasChange(nuevasLineas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaData.moneda_negociacion, tipoCambio]);

  // ─── Calcular totales ───────────────────────────────────────
  const totalUsd = lineas.reduce((sum, l) => sum + l.subtotal_usd, 0);
  const totalMoneda = lineas.reduce((sum, l) => sum + l.subtotal_moneda, 0);

  // ─── Formateo de montos ─────────────────────────────────────
  const formatMonto = (monto, mon) => {
    if (monto == null) return "—";
    const num = Number(monto);
    if (mon === "PYG") {
      return `₲ ${num.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
    }
    if (mon === "BRL") {
      return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* ─── Configuración de la venta ─────────────────────────── */}
      <Section title="Configuración de la Venta">
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Origen */}
          <Field label="Origen de la Venta *">
            <select
              className={selectClass}
              value={ventaData.origen || "sucursal"}
              onChange={(e) =>
                onVentaChange({ ...ventaData, origen: e.target.value })
              }
            >
              {ORIGENES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Moneda de negociación */}
          <Field label="Moneda de Negociación">
            <select
              className={selectClass}
              value={ventaData.moneda_negociacion || "USD"}
              onChange={(e) =>
                onVentaChange({
                  ...ventaData,
                  moneda_negociacion: e.target.value,
                })
              }
            >
              {MONEDAS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Tier de precio (informativo) */}
          <Field label="Tier de Precio">
            <div className="flex items-center h-[42px]">
              <Badge variant="primary">
                {TIER_LABELS[tier]}
              </Badge>
              {!ventaData.cliente && (
                <span className="ml-2 text-xs text-slate-400">
                  (sin cliente = público)
                </span>
              )}
            </div>
          </Field>
        </div>

        {/* Tipo de cambio widget */}
        <div className="px-6 pb-6">
          <TipoCambioWidget
            moneda={ventaData.moneda_negociacion || "USD"}
            onTipoCambio={setTipoCambio}
          />
        </div>
      </Section>

      {/* ─── Selección de cliente ──────────────────────────────── */}
      <Section title="Cliente (Opcional)">
        <div className="p-6">
          {ventaData.cliente ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <User size={16} className="text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {ventaData.cliente.razon_social}
                </p>
                <p className="text-xs text-slate-500">
                  {ventaData.cliente.ruc && `RUC: ${ventaData.cliente.ruc} · `}
                  Tier: {TIER_LABELS[ventaData.cliente.tier_precio]}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={quitarCliente}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                aria-label="Quitar cliente"
              >
                <X size={14} />
              </Button>
            </div>
          ) : (
            <div className="relative" ref={clienteRef}>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  placeholder="Buscar cliente por nombre o RUC..."
                  className={cn(
                    "w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50",
                    "focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                    "outline-none transition-all text-sm text-slate-700 placeholder:text-slate-400"
                  )}
                  aria-label="Buscar cliente"
                />
                {buscandoClientes && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Dropdown de resultados de clientes */}
              {showClientes && clientesResultados.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {clientesResultados.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => seleccionarCliente(cliente)}
                      className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        {cliente.razon_social}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cliente.ruc && `RUC: ${cliente.ruc} · `}
                        Tier: {TIER_LABELS[cliente.tier_precio]}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-2 text-xs text-slate-400">
                Sin cliente seleccionado se aplica el tier &ldquo;Público&rdquo;
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* ─── Líneas de venta ───────────────────────────────────── */}
      <Section
        title="Productos"
        action={
          <span className="text-xs text-slate-400">
            {lineas.length}/100 líneas
          </span>
        }
      >
        <div className="p-6 space-y-4">
          {/* Buscador de productos */}
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por código o nombre (mín. 2 caracteres)..."
                className={cn(
                  "w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50",
                  "focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                  "outline-none transition-all text-sm text-slate-700 placeholder:text-slate-400"
                )}
                disabled={lineas.length >= 100}
                aria-label="Buscar producto"
              />
              {buscando && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Dropdown de resultados */}
            {showResultados && resultados.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {resultados.map((variante) => {
                  const { precioUsd, precioMoneda } = calcularPrecio(variante);
                  return (
                    <button
                      key={variante.id}
                      type="button"
                      onClick={() => agregarProducto(variante)}
                      className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {variante.nombre_variante || variante.producto_nombre}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {variante.product_code}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-700">
                          {formatMonto(precioMoneda, ventaData.moneda_negociacion || "USD")}
                        </p>
                        {ventaData.moneda_negociacion !== "USD" && (
                          <p className="text-[10px] text-slate-400">
                            $ {precioUsd.toFixed(2)} USD
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {showResultados && resultados.length === 0 && busquedaDebounced.length >= 2 && !buscando && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center">
                <p className="text-sm text-slate-500">
                  No se encontraron productos
                </p>
              </div>
            )}
          </div>

          {/* Tabla de líneas */}
          {lineas.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="py-2.5 pl-4 pr-2 text-[10px] font-black uppercase tracking-widest w-10">
                      #
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-widest">
                      Producto
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-widest w-24">
                      Cant.
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-right">
                      P. Unit.
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-right">
                      Subtotal
                    </th>
                    <th className="py-2.5 pl-3 pr-4 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea, index) => (
                    <LineaVentaRow
                      key={`${linea.variante_id}-${index}`}
                      linea={linea}
                      moneda={ventaData.moneda_negociacion || "USD"}
                      tier={tier}
                      index={index}
                      onCantidadChange={(val) =>
                        handleCantidadChange(index, val)
                      }
                      onRemove={() => handleRemoveLinea(index)}
                    />
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-end gap-6">
                  {ventaData.moneda_negociacion !== "USD" && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Total USD
                      </p>
                      <p className="text-sm font-semibold text-slate-600">
                        $ {totalUsd.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Total {ventaData.moneda_negociacion || "USD"}
                    </p>
                    <p className="text-lg font-bold text-emerald-700">
                      {formatMonto(totalMoneda, ventaData.moneda_negociacion || "USD")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart size={40} className="text-slate-200 mb-3" />
              <p className="text-sm text-slate-500">
                Buscá un producto para agregar líneas a la venta
              </p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
