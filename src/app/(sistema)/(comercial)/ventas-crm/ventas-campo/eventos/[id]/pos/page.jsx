"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote,
  Search, ArrowLeft, CheckCircle, Users, UserPlus, Loader2, Save,
} from "lucide-react";
import {
  LoadingScreen, Button, Badge, Input, Field, useToast, useConfirm,
  PhoneInput, validatePhone, buildPhoneValue,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { getEvento, getStockEvento, crearVentaCampo } from "@/services/apis/ventas-campo";
import { getClientes, createCliente } from "@/services/apis/ventas";

// ─── POS de Campo ───────────────────────────────────────────────

export default function POSCampoPage() {
  const { id: eventoId } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const { data: evento, execute: fetchEvento } = useApi(getEvento);
  const { data: stockData, execute: fetchStock } = useApi(getStockEvento);

  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebounce(busqueda, 300);
  const [procesando, setProcesando] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo_pyg");
  const [monedaPago, setMonedaPago] = useState("PYG");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [showClientePicker, setShowClientePicker] = useState(false);
  const [requiereFactura, setRequiereFactura] = useState(false);

  useEffect(() => {
    if (eventoId) {
      fetchEvento(eventoId);
      fetchStock(eventoId);
    }
  }, [eventoId, fetchEvento, fetchStock]);

  // Stock agrupado por variante (sumar disponible de todos los lotes)
  const stockAgrupado = useMemo(() => {
    if (!stockData) return [];
    const mapa = {};
    for (const item of stockData) {
      if (!mapa[item.variante_id]) {
        mapa[item.variante_id] = {
          variante_id: item.variante_id,
          variante_codigo: item.variante_codigo,
          variante_nombre: item.variante_nombre,
          disponible: 0,
        };
      }
      mapa[item.variante_id].disponible += item.disponible;
    }
    return Object.values(mapa);
  }, [stockData]);

  // Filtrar productos según búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busquedaDebounced) return stockAgrupado;
    const term = busquedaDebounced.toLowerCase();
    return stockAgrupado.filter(
      p => p.variante_nombre.toLowerCase().includes(term) ||
           p.variante_codigo.toLowerCase().includes(term)
    );
  }, [stockAgrupado, busquedaDebounced]);

  // ─── Carrito ────────────────────────────────────────────────

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(c => c.variante_id === producto.variante_id);
      if (existe) {
        if (existe.cantidad >= producto.disponible) {
          showToast("Stock insuficiente para agregar más.", "warning");
          return prev;
        }
        return prev.map(c =>
          c.variante_id === producto.variante_id
            ? { ...c, cantidad: c.cantidad + 1 }
            : c
        );
      }
      return [...prev, {
        variante_id: producto.variante_id,
        variante_codigo: producto.variante_codigo,
        variante_nombre: producto.variante_nombre,
        cantidad: 1,
        precio_unitario_usd: 0, // Se debe setear
        disponible: producto.disponible,
      }];
    });
  };

  const cambiarCantidad = (varianteId, delta) => {
    setCarrito(prev => prev.map(c => {
      if (c.variante_id !== varianteId) return c;
      const nueva = c.cantidad + delta;
      if (nueva <= 0) return c;
      if (nueva > c.disponible) {
        showToast("No hay más stock disponible.", "warning");
        return c;
      }
      return { ...c, cantidad: nueva };
    }));
  };

  const cambiarPrecio = (varianteId, precio) => {
    setCarrito(prev => prev.map(c =>
      c.variante_id === varianteId ? { ...c, precio_unitario_usd: Number(precio) || 0 } : c
    ));
  };

  const quitarDelCarrito = (varianteId) => {
    setCarrito(prev => prev.filter(c => c.variante_id !== varianteId));
  };

  const totalUsd = useMemo(() => {
    return carrito.reduce((sum, c) => sum + c.precio_unitario_usd * c.cantidad, 0);
  }, [carrito]);

  // ─── Cobrar ─────────────────────────────────────────────────

  const handleCobrar = async () => {
    if (carrito.length === 0) {
      showToast("El carrito está vacío.", "warning");
      return;
    }
    if (carrito.some(c => c.precio_unitario_usd <= 0)) {
      showToast("Todos los productos deben tener un precio.", "warning");
      return;
    }
    if (requiereFactura && !clienteSeleccionado) {
      showToast("Para emitir factura debés seleccionar un cliente.", "warning");
      return;
    }

    const ok = await confirm(
      `¿Confirmar venta por $${totalUsd.toFixed(2)} USD?`,
      "Confirmar Venta"
    );
    if (!ok) return;

    setProcesando(true);
    try {
      await crearVentaCampo(eventoId, {
        cliente_id: clienteSeleccionado?.id || null,
        lineas: carrito.map(c => ({
          variante_id: c.variante_id,
          cantidad: c.cantidad,
          precio_unitario_usd: c.precio_unitario_usd.toFixed(2),
        })),
        pagos: [{
          metodo: metodoPago,
          monto: totalUsd.toFixed(2),
          moneda: monedaPago,
        }],
        moneda_negociacion: "USD",
        requiere_factura: requiereFactura,
      });
      showToast("Venta registrada correctamente.", "success");
      setCarrito([]);
      setClienteSeleccionado(null);
      setRequiereFactura(false);
      fetchStock(eventoId);
    } catch (err) {
      const detail = err?.data?.detail || err?.message || "Error al registrar venta";
      showToast(detail, "error");
    } finally {
      setProcesando(false);
    }
  };

  if (!evento || !stockData) return <LoadingScreen texto="Cargando POS..." />;

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header compacto */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/ventas-crm/ventas-campo/eventos/${eventoId}`)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-800">POS de Campo</h1>
            <p className="text-xs text-slate-400">{evento.titulo}</p>
          </div>
        </div>
        <Badge variant="success">Evento Activo</Badge>
      </div>

      {/* Contenido principal: 2 columnas */}
      <div className="flex-1 flex overflow-hidden">

        {/* Columna izquierda: Catálogo */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 bg-white">
          {/* Búsqueda */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por nombre o código..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto p-4">
            {productosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">No se encontraron productos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {productosFiltrados.map(producto => (
                  <button
                    key={producto.variante_id}
                    onClick={() => agregarAlCarrito(producto)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer",
                      "hover:border-emerald-300 hover:bg-emerald-50/50",
                      "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{producto.variante_nombre}</p>
                      <p className="text-xs text-slate-400 font-mono">{producto.variante_codigo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">Stock</p>
                      <p className="text-sm font-bold text-slate-700">{producto.disponible}</p>
                    </div>
                    <Plus className="w-4 h-4 text-emerald-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Carrito */}
        <div className="w-[380px] flex flex-col bg-white">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">Carrito</h2>
              <Badge variant="default">{carrito.length}</Badge>
            </div>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {carrito.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">
                Agregá productos desde el catálogo.
              </p>
            ) : (
              carrito.map(item => (
                <div key={item.variante_id} className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.variante_nombre}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{item.variante_codigo}</p>
                    </div>
                    <button
                      onClick={() => quitarDelCarrito(item.variante_id)}
                      className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Cantidad */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg">
                      <button
                        onClick={() => cambiarCantidad(item.variante_id, -1)}
                        className="p-1.5 hover:bg-slate-100 rounded-l-lg cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.variante_id, 1)}
                        className="p-1.5 hover:bg-slate-100 rounded-r-lg cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Precio */}
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precio_unitario_usd || ""}
                          onChange={(e) => cambiarPrecio(item.variante_id, e.target.value)}
                          placeholder="Precio"
                          className="w-full text-sm font-medium text-right bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-300"
                        />
                      </div>
                    </div>
                    {/* Subtotal */}
                    <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                      ${(item.precio_unitario_usd * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer: cliente + método de pago + total + botón cobrar */}
          <div className="border-t border-slate-200 p-4 space-y-3 overflow-y-auto max-h-[45%]">

            {/* Selector de Cliente */}
            {showClientePicker ? (
              <ClienteInlinePicker
                onSelect={(cliente) => { setClienteSeleccionado(cliente); setShowClientePicker(false); }}
                onCancel={() => setShowClientePicker(false)}
              />
            ) : clienteSeleccionado ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{clienteSeleccionado.razon_social}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {clienteSeleccionado.ruc || clienteSeleccionado.telefono || ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClientePicker(true)}
                  className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer shrink-0 ml-2"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClientePicker(true)}
                className="flex items-center gap-2 w-full p-2.5 rounded-lg border border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Seleccionar cliente (opcional)</span>
              </button>
            )}

            {/* Requiere factura */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiereFactura}
                onChange={(e) => setRequiereFactura(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-slate-600">Emitir factura legal</span>
            </label>

            {/* Método de pago */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => {
                  setMetodoPago(e.target.value);
                  if (e.target.value.includes("pyg")) setMonedaPago("PYG");
                  else if (e.target.value.includes("usd")) setMonedaPago("USD");
                  else if (e.target.value.includes("brl")) setMonedaPago("BRL");
                  else setMonedaPago("PYG");
                }}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-300"
              >
                <option value="efectivo_pyg">Efectivo PYG</option>
                <option value="efectivo_usd">Efectivo USD</option>
                <option value="efectivo_brl">Efectivo BRL</option>
                <option value="transferencia_pyg">Transferencia PYG</option>
                <option value="tarjeta_credito">Tarjeta Crédito</option>
                <option value="tarjeta_debito">Tarjeta Débito</option>
              </select>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">TOTAL</span>
              <span className="text-xl font-black text-emerald-700">${totalUsd.toFixed(2)}</span>
            </div>

            {/* Botón Cobrar */}
            <Button
              variant="success"
              size="lg"
              icon={CheckCircle}
              onClick={handleCobrar}
              disabled={procesando || carrito.length === 0}
              className="w-full rounded-xl font-bold text-sm shadow-lg"
            >
              {procesando ? "Procesando..." : "COBRAR"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Picker inline de cliente (para POS rápido) ─────────────────

function ClienteInlinePicker({ onSelect, onCancel }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("buscar");
  const queryDebounced = useDebounce(query, 300);
  const { data: clientesData, loading, execute: buscarClientes } = useApi(getClientes, {
    handleError: false,
  });

  useEffect(() => {
    buscarClientes({ page_size: 10 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== "buscar") return;
    const params = { page_size: 10 };
    if (queryDebounced) params.search = queryDebounced;
    buscarClientes(params);
  }, [queryDebounced, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientes = clientesData?.results || [];

  if (mode === "crear") {
    return (
      <NuevoClienteForm
        nombreInicial={query}
        onCreated={onSelect}
        onBack={() => setMode("buscar")}
      />
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-white overflow-hidden">
      <div className="p-2.5 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
            autoFocus
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-300 outline-none"
          />
        </div>
      </div>

      <div className="max-h-36 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
        {!loading && clientes.length === 0 && (
          <div className="py-4 text-center space-y-1.5">
            <p className="text-[11px] text-slate-400">
              {query ? `Sin resultados para "${query}"` : "No hay clientes"}
            </p>
            <button
              type="button"
              onClick={() => setMode("crear")}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <UserPlus className="h-3 w-3" />
              Crear nuevo cliente
            </button>
          </div>
        )}
        {!loading && clientes.map((cliente) => (
          <button
            key={cliente.id}
            type="button"
            onClick={() => onSelect(cliente)}
            className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-800 truncate">{cliente.razon_social}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {[cliente.ruc, cliente.telefono].filter(Boolean).join(" · ") || "Sin contacto"}
            </p>
          </button>
        ))}
      </div>

      <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMode("crear")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
        >
          <UserPlus className="h-3 w-3" />
          Nuevo
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Formulario rápido de nuevo cliente ─────────────────────────

function NuevoClienteForm({ nombreInicial, onCreated, onBack }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    razon_social: nombreInicial || "",
    telefono: "",
    telefonoPrefijo: "+595",
    correo_electronico: "",
    ruc: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
    <div className="rounded-lg border border-emerald-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-emerald-50/50">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded hover:bg-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3 text-slate-500" />
        </button>
        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <UserPlus className="h-3 w-3 text-emerald-600" />
          Nuevo cliente
        </span>
      </div>

      <div className="p-3 space-y-2">
        <Input
          label="Nombre / Razón social *"
          value={form.razon_social}
          onChange={handleField("razon_social")}
          placeholder="Ej: Juan García"
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
        />

        <Input
          label="Correo"
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
      </div>

      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer disabled:opacity-50"
        >
          Volver
        </button>
        <Button
          variant="success"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          icon={saving ? Loader2 : Save}
          className={cn("text-[11px]", saving ? "[&_svg]:animate-spin" : "")}
        >
          {saving ? "..." : "Crear"}
        </Button>
      </div>
    </div>
  );
}
