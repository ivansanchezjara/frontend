"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { FileText, Send, Trash2 } from "lucide-react";
import {
  Button, Section, SearchBar, EmptyState, LoadingScreen, Text,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useBuscarProductos } from "@/hooks/useBuscarProductos";
import {
  updatePresupuesto,
} from "@/services/apis/ventas";
import { cn } from "@/lib/utils";
import ConfigBarPresupuesto from "./ConfigBarPresupuesto";
import TablaProductosPresupuesto from "./TablaProductosPresupuesto";
import {
  getPrecioTier, getPrecioPublico, getPrecioMejor, calcDescuentoImplicito,
  formatFecha, calcSubtotalLinea,
} from "./presupuesto-utils";
import FichaProductoModal from "./FichaProductoModal";

/**
 * Constructor interactivo de presupuesto (borrador).
 * Permite buscar productos, agregar líneas, configurar moneda/vigencia y auto-guarda.
 */
export default function ConstructorPresupuesto({
  oportunidadId, presupuestoBorrador, tierPrecio, productosInteres = [], onEnviar, onEliminar,
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [moneda, setMoneda] = useState(presupuestoBorrador?.moneda || "USD");
  const [notas, setNotas] = useState(presupuestoBorrador?.notas || "");
  const [vigenciaDias, setVigenciaDias] = useState(presupuestoBorrador?.vigencia_dias || 3);
  const [lineas, setLineas] = useState([]);
  const [showNotas, setShowNotas] = useState(Boolean(presupuestoBorrador?.notas));

  // Búsqueda de productos
  const {
    query: busqueda,
    setQuery: setBusqueda,
    resultados: searchResults,
    buscando,
    debouncedQuery: busquedaDebounced,
  } = useBuscarProductos({ debounceMs: 400 });

  // ─── Inicialización de líneas ───────────────────────────────

  // Desde borrador existente
  useEffect(() => {
    if (presupuestoBorrador?.lineas) {
      setLineas(
        presupuestoBorrador.lineas.map((l) => {
          const precioPublico = Number(l.precio_publico) || 0;
          const precioUnitario = Number(l.precio_unitario) || 0;
          const descuento = Number(l.descuento_porcentaje) || 0;
          // Detectar si fue un precio de oferta:
          // precio_publico > precio_unitario y descuento_porcentaje = 0
          const esOferta = precioPublico > 0 && precioUnitario < precioPublico && descuento === 0;

          return {
            variante: l.variante,
            variante_nombre: l.variante_nombre || "",
            variante_sku: l.variante_sku || "",
            producto_nombre: l.producto_nombre || "",
            cantidad: l.cantidad,
            precio_unitario: precioUnitario,
            descuento_porcentaje: descuento,
            descuento_extra_tipo: l.descuento_extra_tipo || "ninguno",
            descuento_extra_valor: Number(l.descuento_extra_valor) || 0,
            notas: l.notas || "",
            precio_publico: precioPublico || precioUnitario,
            precio_tier: esOferta ? precioPublico : precioUnitario,
            tiene_oferta: esOferta,
            precio_oferta: esOferta ? precioUnitario : null,
            oferta_vence: null,
          };
        })
      );
      setMoneda(presupuestoBorrador.moneda || "USD");
      setNotas(presupuestoBorrador.notas || "");
      setVigenciaDias(presupuestoBorrador.vigencia_dias || 15);
      setShowNotas(Boolean(presupuestoBorrador.notas));
    }
  }, [presupuestoBorrador]);

  // Desde productos de interés (solo si no hay borrador)
  useEffect(() => {
    if (!presupuestoBorrador && productosInteres.length > 0 && lineas.length === 0) {
      setLineas(
        productosInteres.map((p) => {
          const precioPublico = Number(p.precio_0_publico) || 0;
          const mejor = getPrecioMejor(p, tierPrecio);
          const precioUnitario = mejor.precio;
          // Si es oferta, no aplicar descuento tier — el precio ya es el final
          const descuento = mejor.tipo === "oferta"
            ? 0
            : calcDescuentoImplicito(precioPublico, precioUnitario);

          return {
            variante: p.variante,
            variante_nombre: p.variante_nombre || "",
            variante_sku: p.variante_sku || "",
            producto_nombre: p.producto_nombre || "",
            cantidad: p.cantidad_estimada || 1,
            precio_unitario: precioUnitario,
            descuento_porcentaje: descuento,
            descuento_extra_tipo: "ninguno",
            descuento_extra_valor: 0,
            precio_publico: precioPublico,
            precio_tier: mejor.precioTier,
            tiene_oferta: mejor.tipo === "oferta",
            precio_oferta: mejor.precioOferta,
            oferta_vence: mejor.ofertaVence,
            notas: "",
          };
        })
      );
    }
  }, [presupuestoBorrador, productosInteres]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Resultados normalizados ────────────────────────────────

  const resultadosNormalizados = useMemo(() => {
    if (busquedaDebounced.length < 2) return [];
    const raw = searchResults || [];
    return raw.map((v) => ({
      id: v.id,
      product_code: v.product_code || "",
      nombre_variante: v.nombre_variante || "",
      producto_nombre: v.producto_nombre || "",
      precio_0_publico: v.precio_0_publico,
      precio_1_estudiante: v.precio_1_estudiante,
      precio_2_reventa: v.precio_2_reventa,
      precio_3_mayorista: v.precio_3_mayorista,
      precio_4_intercompany: v.precio_4_intercompany,
      precio_oferta: v.precio_oferta || null,
      oferta_vence: v.oferta_vence || null,
    }));
  }, [busquedaDebounced, searchResults]);

  // ─── IDs seleccionados ──────────────────────────────────────

  const selectedIds = useMemo(
    () => new Set(lineas.map((l) => l.variante)),
    [lineas]
  );

  // ─── Filas de tabla ─────────────────────────────────────────

  const filasTabla = useMemo(() => {
    const seleccionados = lineas.map((l) => ({
      id: l.variante,
      product_code: l.variante_sku,
      nombre_variante: l.variante_nombre,
      producto_nombre: l.producto_nombre,
      precio_0_publico: l.precio_publico || l.precio_unitario,
      precio_tier: l.precio_tier || l.precio_unitario,
      precio_oferta: l.precio_oferta || null,
      oferta_vence: l.oferta_vence || null,
      tiene_oferta: l.tiene_oferta || false,
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

    return seleccionados;
  }, [lineas, resultadosNormalizados, busquedaDebounced, selectedIds]);

  // ─── Autoguardado ───────────────────────────────────────────

  const saveTimeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  const autoSave = useCallback(
    (nuevasLineas, monedaActual, notasActuales, vigenciaActual) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        if (nuevasLineas.length === 0) return;
        const lineasValidas = nuevasLineas.filter((l) => l.precio_unitario > 0);
        if (lineasValidas.length === 0) return;

        setSaving(true);
        try {
          const payload = {
            oportunidad: parseInt(oportunidadId, 10),
            moneda: monedaActual,
            notas: notasActuales,
            vigencia_dias: vigenciaActual,
            lineas: lineasValidas.map((l) => ({
              variante: l.variante,
              cantidad: l.cantidad,
              precio_publico: l.precio_publico || 0,
              precio_unitario: l.precio_unitario,
              descuento_porcentaje: l.descuento_porcentaje || 0,
              descuento_extra_tipo: l.descuento_extra_tipo || "ninguno",
              descuento_extra_valor: l.descuento_extra_valor || 0,
              notas: l.notas || "",
            })),
          };

          if (presupuestoBorrador) {
            await updatePresupuesto(presupuestoBorrador.id, payload);
          }
        } catch (err) {
          const detail = err?.data?.detail || err?.data?.lineas;
          if (detail) {
            showToast(typeof detail === "string" ? detail : "Error al guardar presupuesto", "error");
          }
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [oportunidadId, presupuestoBorrador, showToast]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    autoSave(lineas, moneda, notas, vigenciaDias);
  }, [lineas, moneda, notas, vigenciaDias]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const precioPublico = getPrecioPublico(fila);
      const mejor = getPrecioMejor(fila, tierPrecio);
      const precioUnitario = mejor.precio;
      // Si es oferta, descuento_porcentaje = 0 porque precio_unitario ya es el precio final de oferta.
      // Si es tier, descuento = diferencia entre público y tier.
      const descuento = mejor.tipo === "oferta"
        ? 0
        : calcDescuentoImplicito(precioPublico, precioUnitario);

      setLineas((prev) => [
        ...prev,
        {
          variante: fila.id,
          variante_nombre: fila.nombre_variante || "",
          variante_sku: fila.product_code || "",
          producto_nombre: fila.producto_nombre || "",
          cantidad: 1,
          precio_unitario: precioUnitario,
          descuento_porcentaje: descuento,
          descuento_extra_tipo: "ninguno",
          descuento_extra_valor: 0,
          precio_publico: precioPublico,
          precio_tier: mejor.precioTier,
          tiene_oferta: mejor.tipo === "oferta",
          precio_oferta: mejor.precioOferta,
          oferta_vence: mejor.ofertaVence,
          notas: "",
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

  const handleDescuentoExtra = (varianteId, tipo, valor) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.variante === varianteId
          ? { ...l, descuento_extra_tipo: tipo, descuento_extra_valor: valor }
          : l
      )
    );
  };

  // ─── Ver stock (modal) ────────────────────────────────────────

  const [fichaVarianteId, setFichaVarianteId] = useState(null);

  const handleVerStock = (fila) => {
    setFichaVarianteId(fila.id);
  };

  // ─── Cálculos ───────────────────────────────────────────────

  const total = useMemo(() => {
    return lineas.reduce((sum, l) => sum + calcSubtotalLinea(l), 0);
  }, [lineas]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <Section
      title={presupuestoBorrador ? `${presupuestoBorrador.codigo} (Borrador)` : "Armar Presupuesto"}
      subtitle={presupuestoBorrador ? `Creado ${formatFecha(presupuestoBorrador.created_at)}` : "Agregá productos para cotizar"}
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
            {saving ? "Guardando..." : `${lineas.length} ítem${lineas.length !== 1 ? "s" : ""}`}
          </Text>
          {presupuestoBorrador && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => onEliminar(presupuestoBorrador.id)}
              className="text-slate-400 hover:text-red-500"
              title="Eliminar borrador"
            />
          )}
          {presupuestoBorrador && lineas.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => onEnviar(presupuestoBorrador.id)}
              disabled={saving || total === 0}
            >
              Enviar al cliente
            </Button>
          )}
        </div>
      }
    >
      <div className="p-5 space-y-4">
        {/* Configuración */}
        <ConfigBarPresupuesto
          moneda={moneda}
          setMoneda={setMoneda}
          vigenciaDias={vigenciaDias}
          setVigenciaDias={setVigenciaDias}
          tierPrecio={tierPrecio}
          showNotas={showNotas}
          setShowNotas={setShowNotas}
          total={total}
        />

        {/* Notas */}
        {showNotas && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Condiciones, observaciones o notas para el cliente..."
              maxLength={2000}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all"
            />
            <Text variant="muted" className="text-right text-[10px] mt-1">
              {notas.length}/2000
            </Text>
          </div>
        )}

        {/* Buscador */}
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por código, nombre o marca..."
        />

        {busqueda.length > 0 && busqueda.length < 2 && (
          <Text variant="muted" className="text-center text-[11px]">
            Escribí al menos 2 caracteres para buscar.
          </Text>
        )}

        {/* Tabla de productos */}
        {filasTabla.length > 0 ? (
          <TablaProductosPresupuesto
            filasTabla={filasTabla}
            lineas={lineas}
            selectedIds={selectedIds}
            tierPrecio={tierPrecio}
            moneda={moneda}
            total={total}
            isLoading={buscando}
            onToggle={handleToggle}
            onCantidad={handleCantidad}
            onDescuentoExtra={handleDescuentoExtra}
            onVerStock={handleVerStock}
          />
        ) : buscando ? (
          <LoadingScreen texto="Buscando productos..." />
        ) : busquedaDebounced.length >= 2 ? (
          <EmptyState
            titulo="Sin resultados"
            descripcion={`No se encontraron productos para "${busquedaDebounced}"`}
          />
        ) : lineas.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <Text variant="muted">Buscá productos para agregarlos al presupuesto</Text>
          </div>
        ) : null}
      </div>

      {/* Modal ficha de producto con tabs (Producto + Stock) */}
      <FichaProductoModal
        varianteId={fichaVarianteId}
        onClose={() => setFichaVarianteId(null)}
      />
    </Section>
  );
}
