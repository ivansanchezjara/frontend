"use client";
import React, { useState, useEffect } from "react";
import { Search, Package, Check, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { Button, Text } from '@/components/ui';

/**
 * ProductSearchModal estandarizado (Strict Light Mode).
 * Modal de búsqueda rápida de productos, variantes y lotes de inventario
 * que permite la selección interactiva mediante filtros de búsqueda local
 * o consultas dinámicas al backend mediante debounce.
 * Reutiliza las piezas de interfaz (Button, Typography - Text).
 */
export default function ProductSearchModal({
  isOpen,
  onClose,
  onSelect,
  apiFunc,
  lotes = [],
  placeholder = "Buscar por código o nombre...",
  emptyMessage = "No se encontraron productos.",
  mode = "lote",
  showEmptyStock = false,
  extraParams = {},
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [lastAddedId, setLastAddedId] = useState(null);

  const { data, loading, execute } = useApi(apiFunc, {
    auto: false,
    args: [{ search: "", limit: 50 }],
    initialData: [],
  });

  useEffect(() => {
    if (isOpen && apiFunc) {
      execute({ search: debouncedSearch, limit: 50, ...extraParams });
    }
  }, [debouncedSearch, isOpen, execute, apiFunc]);

  useEffect(() => {
    if (isOpen) setSearchTerm("");
  }, [isOpen]);

  if (!isOpen) return null;

  const rawData = apiFunc
    ? (data?.results || (Array.isArray(data) ? data : []))
    : (Array.isArray(lotes) ? lotes : (lotes?.results || []));

  let displayData = [];
  if (mode === "variante") {
    const groups = {};
    rawData.forEach((l) => {
      const vid = l.variante;
      if (!groups[vid]) {
        groups[vid] = { ...l, id: vid, variante: vid, cantidad: 0, isVariante: true };
      }
      groups[vid].cantidad += l.cantidad;
    });
    displayData = Object.values(groups);
  } else if (mode === "lote-unico") {
    // Agrupar por lote_codigo: un solo resultado por código de lote
    const groups = {};
    rawData.forEach((l) => {
      const key = l.lote_codigo;
      if (!groups[key]) {
        groups[key] = { ...l, cantidad: 0, total_registros: 0 };
      }
      groups[key].cantidad += l.cantidad;
      groups[key].total_registros += 1;
    });
    displayData = Object.values(groups);
  } else if (mode === "producto") {
    // Modo producto: los items ya vienen como productos del catálogo
    displayData = rawData;
  } else {
    displayData = rawData;
  }

  const filteredData = apiFunc
    ? displayData
    : displayData.filter((l) => {
      const search = searchTerm.toLowerCase();
      if (mode === "producto") {
        return l.nombre_general?.toLowerCase().includes(search) ||
          l.general_code?.toLowerCase().includes(search) ||
          l.brand?.toLowerCase().includes(search);
      }
      const matchesVariante =
        l.variante_nombre?.toLowerCase().includes(search) ||
        l.variante_codigo?.toLowerCase().includes(search) ||
        l.nombre_variante?.toLowerCase().includes(search);
      if (mode === "variante") return matchesVariante;
      return matchesVariante || l.lote_codigo?.toLowerCase().includes(search);
    });

  const finalData = (showEmptyStock || mode === "producto")
    ? filteredData
    : filteredData.filter((item) => item.cantidad > 0);

  const handleSelect = (item) => {
    setLastAddedId(item.id);
    setTimeout(() => setLastAddedId(null), 800);
    onSelect(item);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] font-sans">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50 shrink-0 select-none">
          <div className="flex-1 relative">
            <Search size={22} className={`absolute left-5 top-1/2 -translate-y-1/2 ${loading ? "text-blue-500 animate-pulse" : "text-slate-400"}`} />
            <input
              autoFocus
              type="text"
              placeholder={placeholder}
              className="w-full h-14 bg-white rounded-2xl pl-14 pr-6 text-lg font-black border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-blue-500" size={20} /></div>}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="w-12 h-12 rounded-2xl text-slate-400 hover:bg-slate-200 shrink-0 font-extrabold"
            title="Cerrar modal"
          >
            ✕
          </Button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
          {loading && finalData.length === 0 ? (
            <div className="p-20 text-center select-none">
              <Loader2 className="mx-auto text-blue-200 mb-4 animate-spin" size={40} />
              <Text variant="bodyXs" className="text-slate-400 font-black uppercase tracking-widest text-center mt-2">
                Buscando en el servidor...
              </Text>
            </div>
          ) : finalData.length === 0 ? (
            <div className="p-20 text-center select-none">
              <Package size={40} className="mx-auto text-slate-200 mb-4" />
              <Text variant="bodyXs" className="text-slate-400 font-black uppercase tracking-widest text-center mt-2">
                {emptyMessage}
              </Text>
            </div>
          ) : (
            finalData.map((l) => (
              <button 
                key={l.id} 
                onClick={() => handleSelect(l)} 
                className={`w-full p-5 flex items-center justify-between rounded-3xl transition-all text-left mb-2 border-2 ${
                  lastAddedId === l.id 
                    ? "bg-emerald-50 border-emerald-300 scale-95" 
                    : "hover:bg-blue-50 border-transparent hover:border-blue-100 group"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-350 shadow-sm group-hover:text-blue-500 transition-all shrink-0">
                    {lastAddedId === l.id ? <Check className="text-emerald-500" /> : <Package size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {(mode === "lote" || mode === "lote-unico") && (
                      <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                        {l.lote_codigo}
                      </Text>
                    )}
                    {mode === "producto" ? (
                      <>
                        <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                          {l.general_code}
                        </Text>
                        <Text className="font-black text-slate-900 truncate">
                          {l.nombre_general}
                        </Text>
                        {l.brand && (
                          <Text variant="bodyXs" className="text-slate-400 font-bold uppercase mb-1">
                            {l.brand}
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text className="font-black text-slate-900 truncate">
                          {l.variante_nombre}{" "}
                          <span className="text-slate-450 text-sm font-medium">
                            | {l.nombre_variante || l.variante_nombre}
                          </span>
                        </Text>
                        {mode === "lote" && (
                          <Text variant="bodyXs" className="text-slate-400 font-bold uppercase mb-1">
                            {l.deposito_nombre}
                          </Text>
                        )}
                        {mode === "lote-unico" && l.total_registros > 1 && (
                          <Text variant="bodyXs" className="text-slate-400 font-bold uppercase mb-1">
                            {l.total_registros} depósitos
                          </Text>
                        )}
                        {mode === "variante" && (
                          <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                            {l.variante_codigo}
                          </Text>
                        )}
                        {l.vencimiento && (mode === "lote" || mode === "lote-unico") && (
                          <Text 
                            variant="bodyXs" 
                            className={`font-black uppercase tracking-widest leading-none mt-1 ${
                              new Date(l.vencimiento) < new Date() ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {new Date(l.vencimiento) < new Date() ? "⚠️ VENCIDO" : "✓ VIGENTE"} • {new Date(l.vencimiento).toLocaleDateString("es-AR")}
                          </Text>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4 select-none">
                  {mode !== "producto" && (
                    <>
                      <Text variant="label" className="text-slate-400 block mb-0.5">
                        {mode === "variante" || mode === "lote-unico" ? "STOCK TOTAL" : "STOCK"}
                      </Text>
                      <Text className="text-xl font-black text-slate-900">
                        {l.cantidad}
                      </Text>
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-6 bg-slate-50 flex justify-end shrink-0 border-t border-slate-100 select-none">
          <Button 
            onClick={onClose} 
            className="bg-slate-900 text-white px-10 h-13 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
          >
            CERRAR
          </Button>
        </div>
      </div>
    </div>
  );
}
