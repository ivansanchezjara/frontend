"use client";
import { useState, useCallback, useEffect } from "react";
import {
  FileDown, Plus, Eye, EyeOff, Pencil, Trash2, ExternalLink,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import {
  getCatalogosAdmin, toggleCatalogo, crearCatalogo, actualizarCatalogo, eliminarCatalogo,
} from "@/services/apis/ecommerce";
import { getMarcas } from "@/services/apis/catalogo";
import {
  PageHeader, EmptyState, LoadingScreen, Modal, Button, Input, Field,
  FilerModal, useConfirm,
} from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { getFullImageUrl } from "@/services/apis/catalogo";

// ─── Tarjeta de catálogo ────────────────────────────────────────

function CatalogoCard({ catalogo, onToggle, onEdit, onDelete }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(catalogo.id); }
    finally { setToggling(false); }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white transition-all group ${
      catalogo.activo ? "border-slate-200 hover:shadow-sm" : "border-slate-200 opacity-60"
    }`}>
      {/* Portada */}
      <div className="relative h-40 bg-slate-100">
        {catalogo.portada_url ? (
          <img src={catalogo.portada_url} alt={catalogo.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileDown size={32} className="text-slate-300" />
          </div>
        )}
        {!catalogo.activo && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500 text-white">
            Inactivo
          </span>
        )}
        {catalogo.marca_nombre && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-600 shadow-sm">
            {catalogo.marca_nombre}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{catalogo.titulo}</p>
            {catalogo.descripcion && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{catalogo.descripcion}</p>
            )}
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">#{catalogo.orden}</span>
        </div>

        {/* Link al archivo */}
        {catalogo.enlace_pdf && (
          <a
            href={catalogo.enlace_pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline mt-2"
          >
            <ExternalLink size={10} /> Ver PDF
          </a>
        )}

        {/* Acciones */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              catalogo.activo
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            } disabled:opacity-50`}
          >
            {catalogo.activo ? <><EyeOff size={12} /> Desactivar</> : <><Eye size={12} /> Activar</>}
          </button>
          <button
            onClick={() => onEdit(catalogo)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(catalogo)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-red-500 bg-red-50/50 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal crear/editar catálogo ────────────────────────────────

function CatalogoModal({ open, onClose, onSave, editando }) {
  const [form, setForm] = useState({
    titulo: editando?.titulo || "",
    descripcion: editando?.descripcion || "",
    marca: editando?.marca || "",
    orden: editando?.orden ?? 0,
    portada: editando?.portada || null,
    enlace_pdf: editando?.enlace_pdf || "",
  });
  const [saving, setSaving] = useState(false);
  const [showFiler, setShowFiler] = useState(false);
  const [portadaPreview, setPortadaPreview] = useState(editando?.portada_url || null);
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    getMarcas({ page_size: 200 }).then((data) => {
      setMarcas(data.results || data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleFilerSelect = (file) => {
    const url = getFullImageUrl(file.url || file.file);
    setPortadaPreview(url);
    setForm((f) => ({ ...f, portada: file.id }));
    setShowFiler(false);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={editando ? "Editar Catálogo" : "Nuevo Catálogo"} size="md">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Portada */}
          <Field label="Imagen de portada">
            <div
              onClick={() => setShowFiler(true)}
              className="relative h-36 w-full rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all overflow-hidden"
            >
              {portadaPreview ? (
                <img src={portadaPreview} alt="Portada" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-1">
                  <FileDown size={24} className="text-slate-300 mx-auto" />
                  <p className="text-[11px] text-slate-400">Click para seleccionar imagen</p>
                </div>
              )}
            </div>
            {portadaPreview && (
              <button type="button" onClick={() => { setPortadaPreview(null); setForm({ ...form, portada: null }); }}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium mt-1">
                Quitar portada
              </button>
            )}
          </Field>

          {/* Link al PDF */}
          <Input
            label="Link al PDF (Google Drive, Dropbox, etc.)"
            type="url"
            value={form.enlace_pdf}
            onChange={(e) => setForm({ ...form, enlace_pdf: e.target.value })}
            placeholder="https://drive.google.com/file/d/..."
          />

          <Input
            label="Título *"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            maxLength={200}
            placeholder="Ej: Catálogo 3M ESPE 2026"
            required
          />

          <Field label="Marca">
            <select
              value={form.marca}
              onChange={(e) => setForm({ ...form, marca: e.target.value || null })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            >
              <option value="">Sin marca</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </Field>

          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            maxLength={500}
            placeholder="Breve descripción del contenido (opcional)"
          />

          <Input
            label="Orden"
            type="number"
            value={form.orden}
            onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            min={0}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!form.titulo.trim() || saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            >
              {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear catálogo"}
            </Button>
          </div>
        </form>
      </Modal>

      <FilerModal
        isOpen={showFiler}
        onClose={() => setShowFiler(false)}
        onSelectImage={handleFilerSelect}
      />
    </>
  );
}

// ─── Página principal ───────────────────────────────────────────

export default function CatalogosEcommercePage() {
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const { danger } = useConfirm();
  const { showToast } = useToast();

  const { data, loading, refetch } = useApi(() => getCatalogosAdmin(), { auto: true });

  const catalogos = data?.results || data || [];

  const handleToggle = useCallback(async (id) => {
    try {
      await toggleCatalogo(id);
      showToast("Estado del catálogo actualizado", "success");
      refetch();
    } catch {
      showToast("No se pudo cambiar el estado", "error");
    }
  }, [refetch, showToast]);

  const handleCrear = useCallback(async (form) => {
    await crearCatalogo(form);
    showToast("Catálogo creado correctamente", "success");
    refetch();
  }, [refetch, showToast]);

  const handleEditar = useCallback(async (form) => {
    if (!editando) return;
    await actualizarCatalogo(editando.id, form);
    showToast("Catálogo actualizado", "success");
    setEditando(null);
    refetch();
  }, [editando, refetch, showToast]);

  const handleDelete = useCallback(async (catalogo) => {
    const ok = await danger(
      `¿Eliminar el catálogo "${catalogo.titulo}"? Esta acción no se puede deshacer.`,
      "Eliminar Catálogo",
      { confirmText: "Eliminar" }
    );
    if (!ok) return;
    try {
      await eliminarCatalogo(catalogo.id);
      showToast("Catálogo eliminado", "success");
      refetch();
    } catch {
      showToast("No se pudo eliminar el catálogo", "error");
    }
  }, [refetch, showToast, danger]);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        breadcrumbs={[
          { label: "E-commerce", href: "/ecommerce" },
          { label: "Catálogos PDF" },
        ]}
        subtitle="Gestionar catálogos y fichas técnicas para descarga"
        subtitleClassName="text-emerald-600"
      >
        <Button
          onClick={() => { setEditando(null); setShowModal(true); }}
          variant="primary"
          size="sm"
          icon={Plus}
          className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
        >
          Nuevo catálogo
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Stats */}
          {!loading && catalogos.length > 0 && (
            <p className="text-xs text-slate-500">
              {catalogos.length} catálogo{catalogos.length !== 1 ? "s" : ""} · {catalogos.filter(c => c.activo).length} activo{catalogos.filter(c => c.activo).length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <LoadingScreen texto="Cargando catálogos..." />
          ) : catalogos.length === 0 ? (
            <EmptyState
              icon={<FileDown size={32} strokeWidth={1.5} />}
              titulo="Sin catálogos"
              descripcion="Subí catálogos PDF para que los clientes puedan descargarlos desde la tienda."
              textoBoton="Crear primer catálogo"
              onAction={() => { setEditando(null); setShowModal(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogos.map((c) => (
                <CatalogoCard
                  key={c.id}
                  catalogo={c}
                  onToggle={handleToggle}
                  onEdit={(cat) => { setEditando(cat); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal crear/editar */}
      {showModal && (
        <CatalogoModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSave={editando ? handleEditar : handleCrear}
          editando={editando}
        />
      )}
    </div>
  );
}
