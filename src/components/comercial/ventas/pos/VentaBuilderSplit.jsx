"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search, User, X, ShoppingCart, Plus, Minus, Trash2,
  Package, Tag, RefreshCw, Info, UserPlus, Save, Loader2, Warehouse, Layers,
} from "lucide-react";
import { Button, Badge, Text, Input, PhoneInput, validatePhone, buildPhoneValue, Modal, DataTable } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useBuscarProductos } from "@/hooks/useBuscarProductos";
import { getClientes, createCliente } from "@/services/apis/ventas";
import { getDepositos } from "@/services/apis/movimientos";
import { getLotesPorVarianteId } from "@/services/apis/inventario";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui";
import TipoCambioWidget from "../shared/TipoCambioWidget";
import FichaProductoModal from "../presupuestos/FichaProductoModal";
import LoteSelectorModal from "./LoteSelectorModal";

// ─── Constantes ─────────────────────────────────────────────────

const MONEDAS = [
  { value: "USD", label: "USD", symbol: "$" },
  { value: "PYG", label: "PYG", symbol: "₲" },
  { value: "BRL", label: "BRL", symbol: "R$" },
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

function formatMonto(monto, moneda) {
  if (monto == null) return "—";
  const num = Number(monto);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function getStockValue(variante) {
  return variante?.stock ?? variante?.stock_disponible ?? variante?.stock_total ?? variante?.stock_actual ?? null;
}

function getStockClasses(stock) {
  if (stock === 0) return "text-rose-600 bg-rose-50 border-rose-100";
  if (stock != null && stock <= 5) return "text-amber-600 bg-amber-50 border-amber-100";
  if (stock != null) return "text-emerald-600 bg-emerald-50 border-emerald-100";
  return "text-slate-500 bg-slate-100 border-slate-200";
}

function formatStockLabel(stock) {
  if (stock === 0) return "Sin stock";
  if (stock == null) return "Stock —";
  return `Stock ${stock}`;
}

// ─── Columnas de la tabla de resultados ─────────────────────────

function buildProductColumns({ calcularPrecio, moneda, tipoCambio, carritoIds, agregarProducto, setFichaVarianteId }) {
  return [
    {
      key: 'codigo',
      label: 'SKU',
      resizable: true,
      width: 120,
      minWidth: 80,
      cellClassName: 'truncate max-w-0',
      render: (_, row) => (
        <Text variant="bodyXs" className="font-mono text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 uppercase truncate inline-block max-w-full group-hover:bg-emerald-100 group-hover:border-emerald-200 transition-colors">
          {row.product_code}
        </Text>
      ),
    },
    {
      key: 'producto',
      label: 'Producto / Variante',
      resizable: true,
      width: 260,
      minWidth: 180,
      cellClassName: 'max-w-0',
      render: (_, row) => {
        const enCarrito = carritoIds[row.id] || 0;
        return (
          <div className="min-w-0">
            <Text variant="bodyXs" className="font-black text-slate-800 truncate leading-tight group-hover:text-emerald-600 transition-colors">
              {row.producto_nombre}
            </Text>
            <div className="flex items-center gap-1.5 mt-0.5">
              {row.nombre_variante && row.nombre_variante !== row.producto_nombre && (
                <Text variant="bodyXs" className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                  {row.nombre_variante}
                </Text>
              )}
              {row.brand && (
                <Text variant="bodyXs" className="text-[10px] text-slate-300 truncate">
                  · {row.brand}
                </Text>
              )}
            </div>
            {enCarrito > 0 && (
              <Badge className="mt-1 bg-emerald-50 text-emerald-700 border border-emerald-200 py-0 px-1.5 rounded text-[9px] font-bold">
                ×{enCarrito} en carrito
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: 'Stock',
      resizable: true,
      width: 70,
      minWidth: 55,
      render: (_, row) => {
        const stock = getStockValue(row);
        return (
          <Badge className={cn(
            "px-2 py-0.5 rounded text-[10px] font-black border whitespace-nowrap shadow-sm",
            stock === 0
              ? 'bg-rose-50 text-rose-600 border-rose-100'
              : stock != null && stock <= 5
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          )}>
            {stock === 0 ? "Agotado" : stock != null ? stock : "—"}
          </Badge>
        );
      },
    },
    {
      key: 'precio',
      label: 'Precio',
      resizable: true,
      width: 100,
      minWidth: 80,
      render: (_, row) => {
        const { precioMoneda, tieneOferta, precioTierUsd } = calcularPrecio(row);
        return (
          <div className="text-right">
            <span className={cn("text-xs font-bold", tieneOferta ? "text-rose-600" : "text-emerald-700")}>
              {formatMonto(precioMoneda, moneda)}
            </span>
            {tieneOferta && (
              <div className="text-[9px] text-slate-400 line-through">
                {formatMonto(
                  moneda !== "USD" && tipoCambio
                    ? Math.round(precioTierUsd * parseFloat(tipoCambio.valor))
                    : precioTierUsd,
                  moneda
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'acciones',
      label: '',
      width: 80,
      minWidth: 70,
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setFichaVarianteId(row.id); }}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
            title="Ver ficha"
          >
            <Info size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); agregarProducto(row); }}
            className="w-7 h-7 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
            title="Agregar al carrito"
          >
            <Plus size={12} />
          </button>
        </div>
      ),
    },
  ];
}

// ─── Componente Principal ───────────────────────────────────────

export default function VentaBuilderSplit({
  ventaData, onVentaChange, lineas, onLineasChange, onGuardar, saving,
}) {
  // ─── Búsqueda de productos ──────────────────────────────────
  const {
    query: busqueda,
    setQuery: setBusqueda,
    resultados,
    buscando,
    debouncedQuery: busquedaDebounced,
  } = useBuscarProductos({ debounceMs: 300 });
  const searchInputRef = useRef(null);

  // ─── Modal ficha de producto ────────────────────────────────
  const [fichaVarianteId, setFichaVarianteId] = useState(null);

  // ─── Modal selector de lotes ────────────────────────────────
  const [loteSelectorIndex, setLoteSelectorIndex] = useState(null);

  // ─── Búsqueda de clientes ──────────────────────────────────
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const busquedaClienteDebounced = useDebounce(busquedaCliente, 400);
  const [clientesResultados, setClientesResultados] = useState([]);
  const [showClientes, setShowClientes] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const clienteRef = useRef(null);
  const { execute: fetchClientes, loading: buscandoClientes } = useApi(getClientes);
  const { showToast } = useToast();

  // ─── Tipo de cambio ─────────────────────────────────────────
  const [tipoCambio, setTipoCambio] = useState(null);

  // ─── Depósitos ──────────────────────────────────────────────
  const [depositos, setDepositos] = useState([]);
  const { execute: fetchDepositos } = useApi(getDepositos);

  useEffect(() => {
    fetchDepositos().then((data) => {
      const items = Array.isArray(data) ? data : (data?.results || []);
      setDepositos(items);
      // Auto-seleccionar si solo hay un depósito
      if (items.length === 1 && !ventaData.deposito_sucursal) {
        onVentaChange({ ...ventaData, deposito_sucursal: items[0].id });
      }
    }).catch(() => { });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tier = ventaData.cliente?.tier_precio || "publico";
  const moneda = ventaData.moneda_negociacion || "USD";

  // ─── Buscar clientes ────────────────────────────────────────
  useEffect(() => {
    if (busquedaClienteDebounced.length >= 2) {
      fetchClientes({ search: busquedaClienteDebounced })
        .then((data) => {
          const r = data?.results || data || [];
          setClientesResultados(Array.isArray(r) ? r : []);
          setShowClientes(true);
        })
        .catch(() => setClientesResultados([]));
    } else {
      setClientesResultados([]);
      setShowClientes(false);
    }
  }, [busquedaClienteDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Click fuera para cerrar dropdown de clientes ───────────
  useEffect(() => {
    const handler = (e) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target)) {
        setShowClientes(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Precio según tier + oferta + moneda ────────────────────
  const calcularPrecio = useCallback((variante) => {
    const precioField = TIER_PRECIO_FIELD_MAP[tier] || "precio_0_publico";
    const precioTierUsd = parseFloat(variante[precioField]) || 0;
    const precioOferta = variante.precio_oferta ? parseFloat(variante.precio_oferta) : null;
    const tieneOferta = precioOferta !== null && precioOferta < precioTierUsd;
    const precioUsd = tieneOferta ? precioOferta : precioTierUsd;

    let precioMoneda = precioUsd;
    if (moneda !== "USD" && tipoCambio) {
      precioMoneda = Math.round(precioUsd * parseFloat(tipoCambio.valor));
    }

    return { precioUsd, precioMoneda, tieneOferta, precioOferta, precioTierUsd };
  }, [tier, moneda, tipoCambio]);

  // ─── Agregar producto ───────────────────────────────────────

  // Auto-asignar lotes FEFO para una línea
  const autoAsignarFEFO = useCallback(async (varianteId, cantidad) => {
    try {
      const data = await getLotesPorVarianteId(varianteId);
      const items = Array.isArray(data) ? data : (data?.results || []);
      const lotes = items
        .filter((l) => l.cantidad > 0)
        .filter((l) => !l.vencimiento || new Date(l.vencimiento) >= new Date())
        .sort((a, b) => {
          if (!a.vencimiento) return 1;
          if (!b.vencimiento) return -1;
          return a.vencimiento.localeCompare(b.vencimiento);
        });

      let restante = cantidad;
      const asignaciones = [];
      for (const lote of lotes) {
        if (restante <= 0) break;
        const asignar = Math.min(restante, lote.cantidad);
        asignaciones.push({
          lote: lote.id,
          lote_codigo: lote.lote_codigo,
          vencimiento: lote.vencimiento,
          deposito_nombre: lote.deposito_nombre || "",
          cantidad: asignar,
        });
        restante -= asignar;
      }
      return asignaciones;
    } catch {
      return [];
    }
  }, []);

  const agregarProducto = useCallback((variante) => {
    const stockDisponible = getStockValue(variante);
    if (stockDisponible === 0) {
      showToast("No hay stock disponible para este producto.", "error");
      return;
    }

    const existente = lineas.findIndex((l) => l.variante_id === variante.id);
    if (existente >= 0) {
      const nuevas = [...lineas];
      const nueva = { ...nuevas[existente] };
      const siguienteCantidad = nueva.cantidad + 1;
      if (stockDisponible != null && siguienteCantidad > stockDisponible) {
        showToast(`No hay stock suficiente. Stock disponible: ${stockDisponible}.`, "error");
        return;
      }
      nueva.cantidad = siguienteCantidad;
      nueva.subtotal_usd = nueva.precio_usd * nueva.cantidad;
      nueva.subtotal_moneda = nueva.precio_moneda * nueva.cantidad;
      nuevas[existente] = nueva;
      onLineasChange(nuevas);
    } else {
      const { precioUsd, precioMoneda, tieneOferta, precioOferta, precioTierUsd } = calcularPrecio(variante);
      const nuevaLinea = {
        variante_id: variante.id,
        product_code: variante.product_code,
        nombre: variante.producto_nombre,
        nombre_variante: variante.nombre_variante || "",
        brand: variante.brand || "",
        cantidad: 1,
        stock: stockDisponible,
        precio_usd: precioUsd,
        precio_moneda: precioMoneda,
        subtotal_usd: precioUsd,
        subtotal_moneda: precioMoneda,
        tiene_oferta: tieneOferta,
        precio_oferta: precioOferta,
        precio_tier_usd: precioTierUsd,
        oferta_vence: variante.oferta_vence || null,
        asignaciones: [],
      };
      const nuevasLineas = [...lineas, nuevaLinea];
      onLineasChange(nuevasLineas);

      // Auto-asignar FEFO en background
      const idx = nuevasLineas.length - 1;
      autoAsignarFEFO(variante.id, 1).then((asignaciones) => {
        if (asignaciones.length > 0) {
          onLineasChange((prev) => {
            const copy = [...prev];
            if (copy[idx]?.variante_id === variante.id) {
              copy[idx] = { ...copy[idx], asignaciones };
            }
            return copy;
          });
        }
      });
    }
    searchInputRef.current?.focus();
  }, [lineas, onLineasChange, calcularPrecio, showToast, autoAsignarFEFO]);

  // ─── Keyboard: Enter agrega primer resultado ────────────────
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && resultados.length > 0) {
      e.preventDefault();
      agregarProducto(resultados[0]);
    }
  };

  // ─── Cambiar cantidad ───────────────────────────────────────
  const handleCantidad = (index, delta) => {
    const nuevas = [...lineas];
    const nueva = { ...nuevas[index] };
    const siguienteCantidad = Math.max(1, nueva.cantidad + delta);
    if (nueva.stock != null && siguienteCantidad > nueva.stock) {
      showToast(`No hay stock suficiente. Stock disponible: ${nueva.stock}.`, "error");
      return;
    }
    nueva.cantidad = siguienteCantidad;
    nueva.subtotal_usd = nueva.precio_usd * nueva.cantidad;
    nueva.subtotal_moneda = nueva.precio_moneda * nueva.cantidad;
    nuevas[index] = nueva;
    onLineasChange(nuevas);

    // Re-asignar FEFO con la nueva cantidad
    autoAsignarFEFO(nueva.variante_id, siguienteCantidad).then((asignaciones) => {
      onLineasChange((prev) => {
        const copy = [...prev];
        if (copy[index]?.variante_id === nueva.variante_id) {
          copy[index] = { ...copy[index], asignaciones };
        }
        return copy;
      });
    });
  };

  const handleCantidadInput = (index, val) => {
    const num = parseInt(val, 10);
    if (num > 0) {
      const nuevas = [...lineas];
      const nueva = { ...nuevas[index] };
      if (nueva.stock != null && num > nueva.stock) {
        showToast(`No hay stock suficiente. Stock disponible: ${nueva.stock}.`, "error");
        nueva.cantidad = nueva.stock;
      } else {
        nueva.cantidad = num;
      }
      nueva.subtotal_usd = nueva.precio_usd * nueva.cantidad;
      nueva.subtotal_moneda = nueva.precio_moneda * nueva.cantidad;
      nuevas[index] = nueva;
      onLineasChange(nuevas);

      // Re-asignar FEFO con la nueva cantidad
      autoAsignarFEFO(nueva.variante_id, nueva.cantidad).then((asignaciones) => {
        onLineasChange((prev) => {
          const copy = [...prev];
          if (copy[index]?.variante_id === nueva.variante_id) {
            copy[index] = { ...copy[index], asignaciones };
          }
          return copy;
        });
      });
    }
  };

  const handleRemove = (index) => {
    onLineasChange(lineas.filter((_, i) => i !== index));
  };

  // ─── Recalcular al cambiar moneda/TC ────────────────────────
  useEffect(() => {
    if (lineas.length === 0) return;
    const nuevas = lineas.map((l) => {
      let precioMoneda = l.precio_usd;
      if (moneda !== "USD" && tipoCambio) {
        precioMoneda = Math.round(l.precio_usd * parseFloat(tipoCambio.valor));
      }
      return { ...l, precio_moneda: precioMoneda, subtotal_moneda: precioMoneda * l.cantidad };
    });
    onLineasChange(nuevas);
  }, [moneda, tipoCambio]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Totales ────────────────────────────────────────────────
  const totalUsd = useMemo(() => lineas.reduce((s, l) => s + l.subtotal_usd, 0), [lineas]);
  const totalMoneda = useMemo(() => lineas.reduce((s, l) => s + l.subtotal_moneda, 0), [lineas]);
  const cantidadItems = useMemo(() => lineas.reduce((s, l) => s + l.cantidad, 0), [lineas]);

  // ─── IDs en carrito para badge ──────────────────────────────
  const carritoIds = useMemo(() => {
    const map = {};
    lineas.forEach((l) => { map[l.variante_id] = l.cantidad; });
    return map;
  }, [lineas]);

  // ─── Render ─────────────────────────────────────────────────

  // ─── Resize del panel derecho ───────────────────────────────
  const [cartWidth, setCartWidth] = useState(400);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(400);

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = cartWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(700, Math.max(280, startWidth.current + delta));
      setCartWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [cartWidth]);

  return (
    <div className="flex h-full">
      {/* ═══════ PANEL IZQUIERDO: Búsqueda + Resultados ═══════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior: cliente + moneda */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-3">
          <div className="flex items-center gap-3">
            {/* Cliente */}
            <div className="flex-1 relative" ref={clienteRef}>
              {ventaData.cliente ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <User size={14} className="text-emerald-600 shrink-0" />
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    {ventaData.cliente.razon_social}
                  </span>
                  <Badge variant="primary" className="text-[9px] shrink-0">
                    {TIER_LABELS[ventaData.cliente.tier_precio]}
                  </Badge>
                  <button
                    onClick={() => onVentaChange({ ...ventaData, cliente: null })}
                    className="ml-auto shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={busquedaCliente}
                      onChange={(e) => setBusquedaCliente(e.target.value)}
                      placeholder="Cliente (opcional)..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all"
                    />
                    {showClientes && clientesResultados.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {clientesResultados.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              onVentaChange({ ...ventaData, cliente: c });
                              setBusquedaCliente("");
                              setShowClientes(false);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0"
                          >
                            <p className="text-sm font-semibold text-slate-800">{c.razon_social}</p>
                            <p className="text-xs text-slate-400">
                              {c.ruc && `RUC: ${c.ruc} · `}Tier: {TIER_LABELS[c.tier_precio]}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNuevoClienteModal(true)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all text-xs font-semibold cursor-pointer"
                    title="Crear nuevo cliente"
                  >
                    <UserPlus size={14} />
                    <span className="hidden xl:inline">Nuevo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Moneda */}
            <div className="flex items-center gap-1.5 shrink-0">
              {MONEDAS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => onVentaChange({ ...ventaData, moneda_negociacion: m.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    moneda === m.value
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {m.value}
                </button>
              ))}
            </div>

            {/* Depósito */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Warehouse size={14} className="text-slate-400" />
              <select
                value={ventaData.deposito_sucursal || ""}
                onChange={(e) => onVentaChange({ ...ventaData, deposito_sucursal: e.target.value ? Number(e.target.value) : null })}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all"
              >
                <option value="">Depósito...</option>
                {depositos.map((dep) => (
                  <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TC widget */}
          {moneda !== "USD" && (
            <div className="mt-2">
              <TipoCambioWidget moneda={moneda} onTipoCambio={setTipoCambio} />
            </div>
          )}
        </div>

        {/* Buscador */}
        <div className="shrink-0 px-5 py-3 bg-white border-b border-slate-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar producto por código o nombre... (Enter = agregar primero)"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all"
              autoFocus
            />
            {buscando && (
              <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {resultados.length > 0 ? (
            <DataTable
              columns={buildProductColumns({ calcularPrecio, moneda, tipoCambio, carritoIds, agregarProducto, setFichaVarianteId })}
              data={resultados}
              rowKey="id"
              onRowClick={(row) => agregarProducto(row)}
              variant="rounded"
              size="sm"
              fixedLayout
              className="select-none"
            />
          ) : busquedaDebounced.length >= 2 && !buscando ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package size={32} className="text-slate-200 mb-2" />
              <Text variant="bodySm" className="text-slate-400">
                No se encontraron productos para &ldquo;{busquedaDebounced}&rdquo;
              </Text>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={32} className="text-slate-200 mb-2" />
              <Text variant="bodySm" className="text-slate-400">
                Buscá un producto por código o nombre
              </Text>
              <Text variant="bodyXs" className="text-slate-300 mt-1">
                Mínimo 2 caracteres · Enter agrega el primero
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ RESIZE HANDLE ═══════ */}
      <div
        onMouseDown={handleMouseDown}
        className="w-px shrink-0 cursor-col-resize bg-slate-200 hover:bg-emerald-400 transition-colors relative"
      >
        <div className="absolute inset-y-0 -left-2 -right-2" />
      </div>

      {/* ═══════ PANEL DERECHO: Carrito ═══════ */}
      <div style={{ width: cartWidth }} className="flex flex-col bg-white shrink-0">
        {/* Header carrito */}
        <div className="shrink-0 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-emerald-600" />
            <Text className="text-sm font-bold text-slate-700">Carrito</Text>
          </div>
          <Text variant="bodyXs" className="text-slate-400">
            {cantidadItems} ítem{cantidadItems !== 1 ? "s" : ""} · {lineas.length} línea{lineas.length !== 1 ? "s" : ""}
          </Text>
        </div>

        {/* Lista de líneas */}
        <div className="flex-1 overflow-y-auto">
          {lineas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <ShoppingCart size={40} className="text-slate-200 mb-3" />
              <Text variant="bodySm" className="text-slate-400">
                Carrito vacío
              </Text>
              <Text variant="bodyXs" className="text-slate-300 mt-1">
                Buscá y seleccioná productos a la izquierda
              </Text>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lineas.map((linea, index) => (
                <div key={`${linea.variante_id}-${index}`} className="px-4 py-3 group hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {linea.nombre}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">{linea.product_code}</span>
                        {linea.nombre_variante && linea.nombre_variante !== linea.nombre && (
                          <span className="text-[10px] text-slate-500">· {linea.nombre_variante}</span>
                        )}
                        {linea.tiene_oferta && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-px rounded">
                            OFERTA
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(index)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Controles de cantidad */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCantidad(index, -1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-slate-300 transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={linea.cantidad}
                          onChange={(e) => handleCantidadInput(index, e.target.value)}
                          className="w-12 h-7 text-center text-sm font-bold text-slate-700 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                        />
                        <button
                          onClick={() => handleCantidad(index, 1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium",
                        linea.stock === 0 ? "text-rose-600" : linea.stock != null && linea.stock <= 5 ? "text-amber-600" : "text-slate-500"
                      )}>
                        {linea.stock == null ? "Stock —" : `Stock disponible: ${linea.stock}`}
                      </span>
                      {/* Asignación de lotes */}
                        <div className="mt-1">
                          {linea.asignaciones && linea.asignaciones.length > 0 ? (
                            <button
                              onClick={() => setLoteSelectorIndex(index)}
                              className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                            >
                              <Layers size={10} />
                              {linea.asignaciones.map((a) => (
                                <span key={a.lote} className="bg-emerald-50 border border-emerald-200 rounded px-1 py-px">
                                  {a.lote_codigo} ({a.cantidad})
                                </span>
                              ))}
                            </button>
                          ) : (
                            <button
                              onClick={() => setLoteSelectorIndex(index)}
                              className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
                            >
                              <Layers size={10} />
                              Asignar lotes
                            </button>
                          )}
                        </div>
                    </div>

                    {/* Precio × cant = subtotal */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {formatMonto(linea.subtotal_moneda, moneda)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatMonto(linea.precio_moneda, moneda)} × {linea.cantidad}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer sticky: Totales + acción */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4 space-y-3">
          {/* Totales */}
          <div className="space-y-1">
            {moneda !== "USD" && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total USD</span>
                <span className="font-semibold">$ {totalUsd.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Total</span>
              <span className="text-xl font-black text-emerald-700">
                {formatMonto(totalMoneda, moneda)}
              </span>
            </div>
          </div>

          {/* Tier info */}
          {tier !== "publico" && (
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg">
              <Tag size={10} />
              <span className="font-semibold">Precio {TIER_LABELS[tier]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal ficha de producto */}
      <FichaProductoModal
        varianteId={fichaVarianteId}
        onClose={() => setFichaVarianteId(null)}
      />

      {/* Modal selector de lotes */}
      <LoteSelectorModal
        open={loteSelectorIndex !== null}
        onClose={() => setLoteSelectorIndex(null)}
        variante={loteSelectorIndex !== null ? lineas[loteSelectorIndex] : null}
        cantidadRequerida={loteSelectorIndex !== null ? lineas[loteSelectorIndex]?.cantidad : 0}
        asignacionesActuales={loteSelectorIndex !== null ? (lineas[loteSelectorIndex]?.asignaciones || []) : []}
        onConfirmar={(asignaciones) => {
          if (loteSelectorIndex === null) return;
          const nuevas = [...lineas];
          nuevas[loteSelectorIndex] = { ...nuevas[loteSelectorIndex], asignaciones };
          onLineasChange(nuevas);
        }}
      />

      {/* Modal nuevo cliente */}
      <NuevoClienteModal
        open={showNuevoClienteModal}
        onClose={() => setShowNuevoClienteModal(false)}
        onCreated={(cliente) => {
          onVentaChange({ ...ventaData, cliente });
          setShowNuevoClienteModal(false);
        }}
      />
    </div>
  );
}

// ─── Modal de nuevo cliente ──────────────────────────────────────

function NuevoClienteModal({ open, onClose, onCreated }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    razon_social: "",
    telefono: "",
    telefonoPrefijo: "+595",
    correo_electronico: "",
    ruc: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setForm({ razon_social: "", telefono: "", telefonoPrefijo: "+595", correo_electronico: "", ruc: "" });
      setErrors({});
      setSaving(false);
    }
  }, [open]);

  const handleField = (field) => (e) => {
    const value = e?.target !== undefined ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.razon_social.trim()) {
      newErrors.razon_social = "El nombre es obligatorio.";
    }
    if (form.telefono.trim()) {
      const telefonoError = validatePhone(form.telefonoPrefijo, form.telefono);
      if (telefonoError) newErrors.telefono = telefonoError;
    }
    if (form.correo_electronico.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico)) {
        newErrors.correo_electronico = "Correo inválido.";
      }
    }
    if (!form.telefono.trim() && !form.correo_electronico.trim()) {
      newErrors.telefono = "Al menos teléfono o correo.";
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    try {
      const payload = { razon_social: form.razon_social.trim(), etapa: "prospecto" };
      const telefonoFinal = buildPhoneValue(form.telefonoPrefijo, form.telefono);
      if (telefonoFinal) payload.telefono = telefonoFinal;
      if (form.correo_electronico.trim()) payload.correo_electronico = form.correo_electronico.trim();
      if (form.ruc.trim()) payload.ruc = form.ruc.trim();

      const nuevoCliente = await createCliente(payload);
      showToast(`Cliente "${nuevoCliente.razon_social}" creado`, "success");
      onCreated(nuevoCliente);
    } catch (err) {
      if (err?.status === 400 && err?.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
      } else {
        showToast(err?.data?.detail || err?.message || "Error al crear el cliente", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Cliente" size="sm">
      <div className="p-6 space-y-4">
        <Input
          label="Nombre / Razón social *"
          value={form.razon_social}
          onChange={handleField("razon_social")}
          placeholder="Ej: Juan García o Clínica Dental S.A."
          error={errors.razon_social}
          autoFocus
        />

        <PhoneInput
          label="Teléfono"
          prefix={form.telefonoPrefijo}
          onPrefixChange={(p) => setForm((prev) => ({ ...prev, telefonoPrefijo: p }))}
          value={form.telefono}
          onChange={handleField("telefono")}
          error={errors.telefono}
          helperText={!errors.telefono ? "Al menos teléfono o correo es obligatorio." : undefined}
        />

        <Input
          label="Correo electrónico"
          type="email"
          value={form.correo_electronico}
          onChange={handleField("correo_electronico")}
          placeholder="cliente@ejemplo.com"
          error={errors.correo_electronico}
        />

        <Input
          label="RUC"
          value={form.ruc}
          onChange={handleField("ruc")}
          placeholder="80000000-0"
          error={errors.ruc}
        />

        {errors.non_field_errors && (
          <p className="text-xs text-red-600 font-medium">{errors.non_field_errors}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          icon={saving ? Loader2 : Save}
          className={saving ? "[&_svg]:animate-spin" : ""}
        >
          {saving ? "Guardando..." : "Crear Cliente"}
        </Button>
      </div>
    </Modal>
  );
}
