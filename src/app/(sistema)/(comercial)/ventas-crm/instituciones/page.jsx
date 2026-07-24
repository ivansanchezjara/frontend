"use client";
import { useState, useCallback, useRef, useMemo } from "react";
import {
  Plus, MapPin, Download, Upload, ArrowUpDown,
} from "lucide-react";

import {
  PageHeader, Button, EmptyState, LoadingScreen,
  SearchBar, Pagination,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";
import { parseInstitucionesCSV, generateCSVTemplate } from "@/lib/parseInstituciones";
import {
  getInstituciones,
  bulkCreateInstituciones,
  deleteInstitucion,
} from "@/services/apis/ventas";

import { InstitucionCard, NuevaInstitucionModal, CSVPreview } from "@/components/comercial/instituciones";

// ─── Constantes ─────────────────────────────────────────────────

const PAGE_SIZE = 12;

const OPCIONES_ORDEN = [
  { value: "nombre_asc", label: "Nombre A-Z" },
  { value: "nombre_desc", label: "Nombre Z-A" },
  { value: "ciudad_asc", label: "Ciudad A-Z" },
  { value: "oferta_desc", label: "Más ofertas" },
  { value: "reciente", label: "Más recientes" },
];

// ─── Página Principal ───────────────────────────────────────────

export default function InstitucionesPage() {
  const { showToast } = useToast();
  const { danger } = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("");
  const [orden, setOrden] = useState("nombre_asc");
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);

  const busquedaDebounced = useDebounce(busqueda, 300);

  const { data: instituciones, loading, execute: fetchInstituciones } =
    useApi(getInstituciones, { auto: true, initialData: [] });

  const lista = useMemo(
    () => (Array.isArray(instituciones) ? instituciones : (instituciones?.results || [])),
    [instituciones]
  );

  // Ciudades filtradas por departamento seleccionado
  const ciudadesDisponibles = useMemo(() => {
    if (filtroDepartamento) {
      return CIUDADES_POR_DEPARTAMENTO[filtroDepartamento] || [];
    }
    // Si no hay depto seleccionado, mostrar las ciudades presentes en los datos
    return [...new Set(lista.map((i) => i.ciudad).filter(Boolean))].sort();
  }, [filtroDepartamento, lista]);

  // Departamentos presentes en los datos (para mostrar cuáles tienen registros)
  const departamentosConDatos = useMemo(
    () => new Set(lista.map((i) => i.departamento).filter(Boolean)),
    [lista]
  );

  // ─── Filtrado + Ordenamiento ────────────────────────────────────

  const listaFiltrada = useMemo(() => {
    let r = lista;

    // Búsqueda
    if (busquedaDebounced.trim()) {
      const q = busquedaDebounced
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      r = r.filter((inst) => {
        const n = (inst.razon_social || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const a = (inst.abreviatura || "").toLowerCase();
        return n.includes(q) || a.includes(q);
      });
    }

    // Filtro departamento
    if (filtroDepartamento) {
      r = r.filter((i) => i.departamento === filtroDepartamento);
    }

    // Filtro ciudad
    if (filtroCiudad) {
      r = r.filter((i) => i.ciudad === filtroCiudad);
    }

    // Ordenamiento
    const sorted = [...r];
    switch (orden) {
      case "nombre_asc":
        sorted.sort((a, b) => (a.razon_social || "").localeCompare(b.razon_social || "", "es"));
        break;
      case "nombre_desc":
        sorted.sort((a, b) => (b.razon_social || "").localeCompare(a.razon_social || "", "es"));
        break;
      case "ciudad_asc":
        sorted.sort((a, b) => (a.ciudad || "").localeCompare(b.ciudad || "", "es"));
        break;
      case "oferta_desc":
        sorted.sort((a, b) => (b.cantidad_oferta || 0) - (a.cantidad_oferta || 0));
        break;
      case "reciente":
        sorted.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        break;
      default:
        break;
    }
    return sorted;
  }, [lista, busquedaDebounced, filtroDepartamento, filtroCiudad, orden]);

  const totalPages = Math.ceil(listaFiltrada.length / PAGE_SIZE);
  const listaPaginada = listaFiltrada.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleRefresh = useCallback(() => fetchInstituciones(), [fetchInstituciones]);

  // ─── Handlers ───────────────────────────────────────────────────

  const handleDownloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "plantilla_instituciones.csv";
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "txt", "tsv"].includes(ext)) {
      showToast("Formato no soportado. Usá CSV, TXT o TSV.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseInstitucionesCSV(ev.target.result);
      if (parsed.length === 0) {
        showToast("No se encontraron datos en el archivo.", "error");
        return;
      }
      setPreview(parsed);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleRemovePreviewItem = (idx) =>
    setPreview((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length === 0 ? null : next;
    });

  const handleConfirmUpload = async () => {
    if (!preview || preview.length === 0) return;
    const conErrores = preview.filter((r) => r._errores?.length > 0);
    if (conErrores.length > 0) {
      showToast(
        `Eliminá las ${conErrores.length} instituciones con errores antes de confirmar.`,
        "error"
      );
      return;
    }
    const payload = preview.map(({ _filas, _errores, ...rest }) => rest);
    setUploading(true);
    try {
      const res = await bulkCreateInstituciones(payload);
      const parts = [];
      if (res.creados > 0) parts.push(`${res.creados} creadas`);
      if (res.actualizados > 0) parts.push(`${res.actualizados} actualizadas`);
      if (res.errores > 0) parts.push(`${res.errores} con errores`);
      showToast(
        parts.join(", ") || "Sin cambios",
        res.errores > 0 ? "warning" : "success"
      );
      setPreview(null);
      handleRefresh();
    } catch (err) {
      showToast(err?.data?.detail || "Error al subir instituciones", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (institucion) => {
    const ok = await danger(
      `¿Eliminar "${institucion.razon_social}"?`,
      "Eliminar Institución",
      { confirmText: "Eliminar" }
    );
    if (!ok) return;
    try {
      await deleteInstitucion(institucion.id);
      showToast("Institución eliminada", "success");
      handleRefresh();
    } catch (err) {
      showToast(
        err?.data?.detail || "No se pudo eliminar la institución",
        "error"
      );
    }
  };

  // ─── Loading ────────────────────────────────────────────────────

  if (loading && lista.length === 0)
    return <LoadingScreen texto="Cargando instituciones..." />;

  // ─── Vista Preview CSV ──────────────────────────────────────────

  if (preview) {
    return (
      <CSVPreview
        preview={preview}
        uploading={uploading}
        onRemoveItem={handleRemovePreviewItem}
        onConfirm={handleConfirmUpload}
        onCancel={() => setPreview(null)}
      />
    );
  }

  // ─── Vista Principal ────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Instituciones" },
        ]}
        subtitle={`CRM · ${lista.length} registros`}
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            icon={Download}
            onClick={handleDownloadTemplate}
            size="sm"
          >
            Plantilla
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            disabled={uploading}
          >
            {uploading ? "Subiendo..." : "Subir CSV"}
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowModal(true)}
            size="sm"
          >
            Nueva Institución
          </Button>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Barra de búsqueda y filtros */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
            <SearchBar
              value={busqueda}
              onChange={(val) => {
                setBusqueda(val);
                setPage(1);
              }}
              placeholder="Buscar por nombre o abreviatura..."
            />
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filtro departamento */}
              <div className="flex items-center gap-1.5">
                <MapPin
                  className={cn(
                    "w-3.5 h-3.5",
                    filtroDepartamento
                      ? "text-emerald-600"
                      : "text-slate-400"
                  )}
                />
                <select
                  className={cn(
                    "appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 cursor-pointer border transition-all outline-none",
                    filtroDepartamento
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                  value={filtroDepartamento}
                  onChange={(e) => {
                    setFiltroDepartamento(e.target.value);
                    setFiltroCiudad("");
                    setPage(1);
                  }}
                >
                  <option value="">Todos los departamentos</option>
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                      {departamentosConDatos.has(d) ? "" : " (vacío)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro ciudad */}
              <select
                className={cn(
                  "appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 cursor-pointer border transition-all outline-none",
                  filtroCiudad
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                )}
                value={filtroCiudad}
                onChange={(e) => {
                  setFiltroCiudad(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas las ciudades</option>
                {ciudadesDisponibles.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Selector de orden */}
              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  className="appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 cursor-pointer border border-slate-200 bg-slate-50 text-slate-600 transition-all outline-none"
                  value={orden}
                  onChange={(e) => {
                    setOrden(e.target.value);
                    setPage(1);
                  }}
                >
                  {OPCIONES_ORDEN.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="flex items-center justify-between">
              <Text
                variant="label"
                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    listaFiltrada.length > 0
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  )}
                />
                {listaFiltrada.length}{" "}
                {listaFiltrada.length === 1 ? "resultado" : "resultados"}
              </Text>
              {(filtroDepartamento || filtroCiudad || busquedaDebounced) && (
                <button
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  onClick={() => {
                    setBusqueda("");
                    setFiltroDepartamento("");
                    setFiltroCiudad("");
                    setPage(1);
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Lista de instituciones */}
          {listaFiltrada.length === 0 ? (
            <EmptyState
              titulo={
                busquedaDebounced || filtroDepartamento || filtroCiudad
                  ? "Sin resultados"
                  : "Sin instituciones registradas"
              }
              descripcion={
                busquedaDebounced || filtroDepartamento || filtroCiudad
                  ? "Probá con otros términos o cambiá los filtros."
                  : "Agregá universidades, institutos o centros de capacitación."
              }
              textoBoton={
                busquedaDebounced || filtroDepartamento || filtroCiudad
                  ? "Limpiar filtros"
                  : undefined
              }
              onAction={
                busquedaDebounced || filtroDepartamento || filtroCiudad
                  ? () => {
                      setBusqueda("");
                      setFiltroDepartamento("");
                      setFiltroCiudad("");
                      setPage(1);
                    }
                  : undefined
              }
              icon="🎓"
            />
          ) : (
            <>
              {listaPaginada.map((inst) => (
                <InstitucionCard
                  key={inst.id}
                  institucion={inst}
                  onDelete={handleDelete}
                />
              ))}
              {totalPages > 1 && (
                <Pagination
                  count={listaFiltrada.length}
                  pageSize={PAGE_SIZE}
                  currentPage={page}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </main>

      {showModal && (
        <NuevaInstitucionModal
          onClose={() => setShowModal(false)}
          onSaved={handleRefresh}
        />
      )}
    </div>
  );
}
