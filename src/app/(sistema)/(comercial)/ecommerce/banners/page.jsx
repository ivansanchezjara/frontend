"use client";
import { useState, useCallback } from "react";
import {
  Image as ImageIcon, Plus, Eye, EyeOff, Pencil, Trash2,
  ExternalLink, Calendar, ChevronLeft,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import {
  getBannersAdmin, toggleBanner, crearBanner, actualizarBanner, eliminarBanner,
} from "@/services/apis/ecommerce";
import {
  PageHeader, EmptyState, LoadingScreen, Modal, Button, Input, Field,
  FilerModal, ImageCropper, useConfirm,
} from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { getFullImageUrl } from "@/services/apis/catalogo";

// ─── Helpers ────────────────────────────────────────────────────

const UBICACION_LABEL = {
  hero: "Hero principal",
  secundario: "Secundario",
  popup: "Popup",
};

function formatFecha(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-PY", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Tarjeta de banner ──────────────────────────────────────────

function BannerCard({ banner, onToggle, onEdit, onDelete }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(banner.id); }
    finally { setToggling(false); }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white transition-all group ${
      banner.activo ? "border-slate-200 hover:shadow-sm" : "border-slate-200 opacity-60"
    }`}>
      {/* Imagen preview */}
      <div className="relative h-36 bg-slate-100">
        {banner.imagen_url ? (
          <img src={banner.imagen_url} alt={banner.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-slate-300" />
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-600 shadow-sm">
          {UBICACION_LABEL[banner.ubicacion] || banner.ubicacion}
        </span>
        {!banner.activo && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500 text-white">
            Inactivo
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{banner.nombre_interno || banner.titulo}</p>
            {banner.subtitulo && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{banner.subtitulo}</p>
            )}
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">#{banner.orden}</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {banner.enlace && (
            <a href={banner.enlace} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline">
              <ExternalLink size={10} /> Link
            </a>
          )}
          {banner.fecha_inicio && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar size={10} /> Desde {formatFecha(banner.fecha_inicio)}
            </span>
          )}
          {banner.fecha_fin && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              → Hasta {formatFecha(banner.fecha_fin)}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              banner.activo
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            } disabled:opacity-50`}
          >
            {banner.activo ? <><EyeOff size={12} /> Desactivar</> : <><Eye size={12} /> Activar</>}
          </button>
          <button
            onClick={() => onEdit(banner)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(banner)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-red-500 bg-red-50/50 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal crear/editar banner ──────────────────────────────────

function BannerModal({ open, onClose, onSave, editando }) {
  const [form, setForm] = useState({
    nombre_interno: editando?.nombre_interno || "",
    titulo: editando?.titulo || "",
    subtitulo: editando?.subtitulo || "",
    mostrar_texto: editando?.mostrar_texto ?? false,
    posicion_texto: editando?.posicion_texto || "center-left",
    enlace: editando?.enlace || "",
    boton_texto: editando?.boton_texto || "",
    ubicacion: editando?.ubicacion || "hero",
    orden: editando?.orden ?? 0,
    imagen: editando?.imagen || null,
    imagen_mobile: editando?.imagen_mobile || null,
    fecha_inicio: editando?.fecha_inicio ? editando.fecha_inicio.slice(0, 16) : "",
    fecha_fin: editando?.fecha_fin ? editando.fecha_fin.slice(0, 16) : "",
  });
  const [saving, setSaving] = useState(false);
  const [filerTarget, setFilerTarget] = useState(null); // "desktop" | "mobile"
  const [selectedImg, setSelectedImg] = useState(
    editando?.imagen_url ? { url: editando.imagen_url } : null
  );
  const [selectedImgMobile, setSelectedImgMobile] = useState(
    editando?.imagen_mobile_url ? { url: editando.imagen_mobile_url } : null
  );

  // Cropper state
  const [cropperSrc, setCropperSrc] = useState(null);
  const [cropperTarget, setCropperTarget] = useState(null); // "desktop" | "mobile"

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_interno.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.fecha_inicio) delete payload.fecha_inicio;
      if (!payload.fecha_fin) delete payload.fecha_fin;
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleFilerSelect = (image) => {
    // En vez de asignar directo, abrir el cropper
    const fullUrl = getFullImageUrl(image.url);
    setCropperSrc(fullUrl);
    setCropperTarget(filerTarget);
    setFilerTarget(null);
  };

  const handleCropComplete = async (blob) => {
    // Subir la imagen recortada como archivo nuevo
    const { uploadImage } = await import("@/services/apis/media.js");
    const ext = "jpg";
    const nombre = `banner-${cropperTarget}-${Date.now()}.${ext}`;
    const file = new File([blob], nombre, { type: "image/jpeg" });

    try {
      const uploaded = await uploadImage(file, "root");
      const imgUrl = uploaded.url || uploaded.file;
      const imgId = uploaded.id;

      if (cropperTarget === "mobile") {
        setSelectedImgMobile({ url: imgUrl });
        setForm((f) => ({ ...f, imagen_mobile: imgId }));
      } else {
        setSelectedImg({ url: imgUrl });
        setForm((f) => ({ ...f, imagen: imgId }));
      }
    } catch {
      // Si falla el upload, igualmente cerramos el cropper
    }
    setCropperSrc(null);
    setCropperTarget(null);
  };

  const inputClass = "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300";

  return (
    <>
      <Modal open={open} onClose={onClose} title={editando ? "Editar Banner" : "Nuevo Banner"} size="lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Imágenes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Desktop */}
            <Field label="Imagen Desktop (1920×600)">
              <div
                onClick={() => setFilerTarget("desktop")}
                className="relative h-28 w-full rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all overflow-hidden"
              >
                {selectedImg?.url ? (
                  <img src={getFullImageUrl(selectedImg.url)} alt="Desktop" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-0.5">
                    <ImageIcon size={22} className="text-slate-300 mx-auto" />
                    <p className="text-[10px] text-slate-400">Horizontal</p>
                  </div>
                )}
              </div>
              {selectedImg?.url && (
                <button type="button" onClick={() => { setSelectedImg(null); setForm({ ...form, imagen: null }); }}
                  className="text-[10px] text-red-500 hover:text-red-700 font-medium mt-1">
                  Quitar
                </button>
              )}
            </Field>

            {/* Mobile */}
            <Field label="Imagen Mobile (1080×1080)">
              <div
                onClick={() => setFilerTarget("mobile")}
                className="relative h-28 w-full rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all overflow-hidden"
              >
                {selectedImgMobile?.url ? (
                  <img src={getFullImageUrl(selectedImgMobile.url)} alt="Mobile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-0.5">
                    <ImageIcon size={22} className="text-slate-300 mx-auto" />
                    <p className="text-[10px] text-slate-400">Cuadrada (opcional)</p>
                  </div>
                )}
              </div>
              {selectedImgMobile?.url && (
                <button type="button" onClick={() => { setSelectedImgMobile(null); setForm({ ...form, imagen_mobile: null }); }}
                  className="text-[10px] text-red-500 hover:text-red-700 font-medium mt-1">
                  Quitar
                </button>
              )}
            </Field>
          </div>

          <Input
            label="Nombre interno *"
            value={form.nombre_interno}
            onChange={(e) => setForm({ ...form, nombre_interno: e.target.value })}
            maxLength={100}
            placeholder="Ej: Promo Angelus Junio (solo visible en el admin)"
            required
          />

          {/* Toggle mostrar texto */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-700">Mostrar texto sobre la imagen</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Activar si querés título, subtítulo o botón visibles en la web</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, mostrar_texto: !form.mostrar_texto })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.mostrar_texto ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.mostrar_texto ? "translate-x-5" : ""
              }`} />
            </button>
          </div>

          {/* Campos de texto (solo si mostrar_texto) */}
          {form.mostrar_texto && (
            <div className="space-y-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
              <Input
                label="Título"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                maxLength={100}
                placeholder="Texto principal sobre la imagen"
              />

              <Input
                label="Subtítulo"
                value={form.subtitulo}
                onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                maxLength={200}
                placeholder="Texto secundario"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Texto del botón"
                  value={form.boton_texto}
                  onChange={(e) => setForm({ ...form, boton_texto: e.target.value })}
                  maxLength={30}
                  placeholder="Ver más"
                />
                <Field label="Posición del texto">
                  <select
                    value={form.posicion_texto}
                    onChange={(e) => setForm({ ...form, posicion_texto: e.target.value })}
                    className={inputClass}
                  >
                    <option value="top-left">↖ Arriba izquierda</option>
                    <option value="top-center">↑ Arriba centro</option>
                    <option value="top-right">↗ Arriba derecha</option>
                    <option value="center-left">← Centro izquierda</option>
                    <option value="center">● Centro</option>
                    <option value="center-right">→ Centro derecha</option>
                    <option value="bottom-left">↙ Abajo izquierda</option>
                    <option value="bottom-center">↓ Abajo centro</option>
                    <option value="bottom-right">↘ Abajo derecha</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ubicación">
              <select
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                className={inputClass}
              >
                <option value="hero">Hero principal</option>
                <option value="secundario">Secundario</option>
                <option value="popup">Popup</option>
              </select>
            </Field>
            <Input
              label="Orden"
              type="number"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
              min={0}
            />
          </div>

          <Input
            label="Enlace (URL al hacer click)"
            type="url"
            value={form.enlace}
            onChange={(e) => setForm({ ...form, enlace: e.target.value })}
            placeholder="https://..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Vigencia desde">
              <input
                type="datetime-local"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Vigencia hasta">
              <input
                type="datetime-local"
                value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!form.nombre_interno.trim() || saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            >
              {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear banner"}
            </Button>
          </div>
        </form>
      </Modal>

      <FilerModal
        isOpen={!!filerTarget}
        onClose={() => setFilerTarget(null)}
        onSelectImage={handleFilerSelect}
      />

      <ImageCropper
        open={!!cropperSrc}
        imageSrc={cropperSrc}
        aspect={cropperTarget === "mobile" ? 1 : 1920 / 600}
        aspectLabel={cropperTarget === "mobile" ? "1080×1080" : "1920×600"}
        onCrop={handleCropComplete}
        onClose={() => { setCropperSrc(null); setCropperTarget(null); }}
      />
    </>
  );
}

// ─── Página principal ───────────────────────────────────────────

export default function BannersEcommercePage() {
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const { danger } = useConfirm();
  const { showToast } = useToast();

  const { data, loading, refetch } = useApi(() => getBannersAdmin(), { auto: true });

  const banners = data?.results || data || [];

  const handleToggle = useCallback(async (id) => {
    try {
      await toggleBanner(id);
      showToast("Estado del banner actualizado", "success");
      refetch();
    } catch {
      showToast("No se pudo cambiar el estado", "error");
    }
  }, [refetch, showToast]);

  const handleCrear = useCallback(async (form) => {
    await crearBanner(form);
    showToast("Banner creado correctamente", "success");
    refetch();
  }, [refetch, showToast]);

  const handleEditar = useCallback(async (form) => {
    if (!editando) return;
    await actualizarBanner(editando.id, form);
    showToast("Banner actualizado", "success");
    setEditando(null);
    refetch();
  }, [editando, refetch, showToast]);

  const handleDelete = useCallback(async (banner) => {
    const ok = await danger(
      `¿Eliminar el banner "${banner.titulo}"? Esta acción no se puede deshacer.`,
      "Eliminar Banner",
      { confirmText: "Eliminar" }
    );
    if (!ok) return;
    try {
      await eliminarBanner(banner.id);
      showToast("Banner eliminado", "success");
      refetch();
    } catch {
      showToast("No se pudo eliminar el banner", "error");
    }
  }, [refetch, showToast, danger]);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        breadcrumbs={[
          { label: "E-commerce", href: "/ecommerce" },
          { label: "Banners" },
        ]}
        subtitle="Gestionar carousel y promociones de la tienda"
        subtitleClassName="text-emerald-600"
      >
        <Button
          onClick={() => { setEditando(null); setShowModal(true); }}
          variant="primary"
          size="sm"
          icon={Plus}
          className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
        >
          Nuevo banner
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Stats */}
          {!loading && banners.length > 0 && (
            <p className="text-xs text-slate-500">
              {banners.length} banner{banners.length !== 1 ? "s" : ""} · {banners.filter(b => b.activo).length} activo{banners.filter(b => b.activo).length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <LoadingScreen texto="Cargando banners..." />
          ) : banners.length === 0 ? (
            <EmptyState
              icon={<ImageIcon size={32} strokeWidth={1.5} />}
              titulo="Sin banners"
              descripcion="Creá banners para el carousel de la tienda online."
              textoBoton="Crear primer banner"
              onAction={() => { setEditando(null); setShowModal(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((b) => (
                <BannerCard
                  key={b.id}
                  banner={b}
                  onToggle={handleToggle}
                  onEdit={(banner) => { setEditando(banner); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal crear/editar */}
      {showModal && (
        <BannerModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSave={editando ? handleEditar : handleCrear}
          editando={editando}
        />
      )}
    </div>
  );
}
