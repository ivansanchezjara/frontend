"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Check } from "lucide-react";
import {
  Section,
  Badge,
  Text,
  Input,
  SearchBar,
  EmptyState,
  LoadingScreen,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { updateOportunidad, buscarProductos } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

/**
 * Sección de productos de interés de una oportunidad.
 * Tabla siempre visible. Autoguarda al marcar/desmarcar.
 * Seleccionados aparecen primero.
 */
export default function ProductosInteresSection({
  oportunidadId,
  productos = [],
  editable = false,
  onUpdated,
}) {
  const { showToast } = useToast();
  const [localProductos, setLocalProductos] = useState(productos);
  const [saving, setSaving] = useState(false);

  // Búsqueda
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebounce(busqueda, 400);
  const {
    data: searchResults,
    loading: buscando,
    execute: buscar,
  } = useApi(buscarProductos);

  // Sincronizar props → local
  useEffect(() => {
    setLocalProductos(productos);
  }, [productos]);

  // Buscar cuando cambia el término (mínimo 2 chars)
  useEffect(() => {
    if (busquedaDebounced.length >= 2) {
      buscar({ q: busquedaDebounced });
    }
  }, [busquedaDebounced, buscar]);

  // ─── Normalizar resultados ──────────────────────────────────

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

  // ─── Autoguardado ───────────────────────────────────────────

  const saveTimeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  const autoSave = useCallback(
    (nuevosProductos) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          const payload = nuevosProductos.map((p) => ({
            variante: p.variante,
            cantidad_estimada: p.cantidad_estimada,
            notas: p.notas || "",
          }));
          await updateOportunidad(oportunidadId, { productos: payload });
        } catch {
          showToast("Error al guardar productos", "error");
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [oportunidadId, showToast]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!editable) return;
    const currentIds = localProductos.map((p) => `${p.variante}:${p.cantidad_estimada}`).join(",");
    const propsIds = productos.map((p) => `${p.variante}:${p.cantidad_estimada}`).join(",");
    if (currentIds !== propsIds) {
      autoSave(localProductos);
    }
  }, [localProductos]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ─── Seleccionados set ──────────────────────────────────────

  const selectedIds = useMemo(
    () => new Set(localProductos.map((p) => p.variante)),
    [localProductos]
  );

  // ─── Lista combinada: seleccionados primero ─────────────────

  const filasTabla = useMemo(() => {
    const seleccionados = localProductos.map((p) => ({
      id: p.variante,
      product_code: p.variante_sku || "",
      nombre_variante: p.variante_nombre || "",
      producto_nombre: p.producto_nombre || "",
      precio_0_publico: p._precios?.publico || null,
      precio_1_estudiante: p._precios?.estudiante || null,
      precio_2_reventa: p._precios?.reventa || null,
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
  }, [localProductos, resultadosNormalizados, busquedaDebounced, selectedIds]);

  // ─── Handlers ───────────────────────────────────────────────

  const handleToggle = (fila) => {
    if (selectedIds.has(fila.id)) {
      setLocalProductos((prev) => prev.filter((p) => p.variante !== fila.id));
    } else {
      setLocalProductos((prev) => [
        ...prev,
        {
          variante: fila.id,
          variante_nombre: fila.nombre_variante || "",
          variante_sku: fila.product_code || "",
          producto_nombre: fila.producto_nombre || "",
          cantidad_estimada: 1,
          notas: "",
          _precios: {
            publico: fila.precio_0_publico,
            estudiante: fila.precio_1_estudiante,
            reventa: fila.precio_2_reventa,
          },
        },
      ]);
    }
  };

  const handleCantidad = (varianteId, cantidad) => {
    setLocalProductos((prev) =>
      prev.map((p) =>
        p.variante === varianteId
          ? { ...p, cantidad_estimada: Math.max(1, Number(cantidad) || 1) }
          : p
      )
    );
  };

  // ─── Formatear precio ───────────────────────────────────────

  const formatPrecio = (valor) => {
    if (!valor || valor === "0" || valor === "None") return "—";
    return `$${Number(valor).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ─── Read-only mode ─────────────────────────────────────────

  if (!editable) {
    return (
      <Section
        title="Productos de interés"
        action={
          localProductos.length > 0 ? (
            <Badge variant="default" className="text-[10px]">
              {localProductos.length} producto
              {localProductos.length !== 1 ? "s" : ""}
            </Badge>
          ) : null
        }
      >
        <div className="p-6">
          {localProductos.length === 0 ? (
            <EmptyState
              titulo="Sin productos de interés"
              descripcion="No hay productos registrados para esta oportunidad."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 pl-5 pr-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Producto / Variante</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localProductos.map((prod, idx) => (
                    <tr key={prod.variante || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 pl-5 pr-3">
                        <Badge className="font-mono text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                          {prod.variante_sku || "—"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Text variant="bodyXs" className="font-black text-slate-800 truncate leading-tight">
                          {prod.producto_nombre}
                        </Text>
                        {prod.variante_nombre && (
                          <Text variant="bodyXs" className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                            {prod.variante_nombre}
                          </Text>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="success" className="text-[10px] font-black">
                          x{prod.cantidad_estimada}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>
    );
  }

  // ─── Editable mode ──────────────────────────────────────────

  return (
    <Section
      title="Productos de interés"
      action={
        <Text variant="label" className="flex items-center gap-1.5 text-slate-400">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full transition-all",
            saving
              ? "bg-amber-400 animate-pulse"
              : localProductos.length > 0
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                : "bg-slate-300"
          )} />
          {saving
            ? "Guardando..."
            : `${localProductos.length} seleccionado${localProductos.length !== 1 ? "s" : ""}`
          }
        </Text>
      }
    >
      <div className="p-5 space-y-4">
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
            buscando && "opacity-50 pointer-events-none"
          )}>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 pl-4 pr-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-11"></th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-[130px]">SKU</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Producto / Variante</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[90px]">Público</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[90px]">Estudiante</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[90px]">Reventa</th>
                    <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-[80px]">Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filasTabla.map((fila) => {
                    const selected = selectedIds.has(fila.id);
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
                        <td className="py-2.5 px-3">
                          <Badge className="font-mono text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                            {fila.product_code || "—"}
                          </Badge>
                        </td>
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
                        <td className="py-2.5 px-3 text-right">
                          <Text variant="bodyXs" className="font-black text-slate-800">
                            {formatPrecio(fila.precio_0_publico)}
                          </Text>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Text variant="bodyXs" className="font-semibold text-slate-500">
                            {formatPrecio(fila.precio_1_estudiante)}
                          </Text>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Text variant="bodyXs" className="font-semibold text-slate-500">
                            {formatPrecio(fila.precio_2_reventa)}
                          </Text>
                        </td>
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {selected ? (
                            <Input
                              type="number"
                              min="1"
                              value={
                                localProductos.find((p) => p.variante === fila.id)
                                  ?.cantidad_estimada || 1
                              }
                              onChange={(e) => handleCantidad(fila.id, e.target.value)}
                              className="w-16 text-center text-xs font-black !py-1 !px-1.5 !rounded-lg !border-emerald-200 !bg-emerald-50"
                              fullWidth={false}
                            />
                          ) : (
                            <Text variant="muted" className="text-xs">—</Text>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : buscando ? (
          <LoadingScreen texto="Buscando productos..." />
        ) : busquedaDebounced.length >= 2 ? (
          <EmptyState
            titulo="Sin resultados"
            descripcion={`No se encontraron productos para "${busquedaDebounced}"`}
          />
        ) : localProductos.length === 0 ? (
          <EmptyState
            titulo="Buscá productos"
            descripcion="Usá el buscador para encontrar y seleccionar productos de interés."
          />
        ) : null}
      </div>
    </Section>
  );
}
