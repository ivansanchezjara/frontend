"use client";
import { useState, useCallback } from "react";
import {
  Calendar, Plus, Eye, EyeOff, Pencil, Trash2,
  MapPin, User, Clock, ExternalLink,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import {
  getEventosAdmin, toggleEvento, crearEvento, actualizarEvento, eliminarEvento,
} from "@/services/apis/ecommerce";
import {
  PageHeader, EmptyState, LoadingScreen, Modal, Button, Input, Field,
  FilerModal, ImageCropper, useConfirm,
} from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { getFullImageUrl } from "@/services/apis/catalogo";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(iso) {
  if (!iso) return null;
  return new Date(iso + "T00:00:00").toLocaleDateString("es-PY", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Tarjeta de evento ──────────────────────────────────────────

function EventoCard({ evento, onToggle, onEdit, onDelete }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(evento.id); }
    finally { setToggling(false); }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white transition-all group ${
      evento.activo ? "border-slate-200 hover:shadow-sm" : "border-slate-200 opacity-60"
    }`}>
      {/* Imagen */}
      <div className="relative aspect-square bg-slate-100">
        {evento.imagen_url ? (
          <img src={evento.imagen_url} alt={evento.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={32} className="text-slate-300" />
          </div>
        )}
        {!evento.activo && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500 text-white">
            Inactivo
          </span>
        )}
        {evento.fecha && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-600 shadow-sm">
            {formatFecha(evento.fecha)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm font-bold text-slate-800 truncate">{evento.titulo}</p>

        <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-slate-500">
          {evento.lugar && (
            <span className="flex items-center gap-1">
              <MapPin size={10} /> {evento.lugar}
            </span>
          )}
          {evento.ponente && (
            <span className="flex items-center gap-1">
              <User size={10} /> {evento.ponente}
            </span>
          )}
          {evento.hora_inicio && (
            <span className="flex items-center gap-1">
              <Clock size={10} /> {evento.hora_inicio}{evento.hora_fin ? ` - ${evento.hora_fin}` : ""}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              evento.activo
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            } disabled:opacity-50`}
          >
            {evento.activo ? <><EyeOff size={12} /> Desactivar</> : <><Eye size={12} /> Activar</>}
          </button>
          <button
            onClick={() => onEdit(evento)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(evento)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-red-500 bg-red-50/50 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal crear/editar evento ──────────────────────────────────

function EventoModal({ open, onClose, onSave, editando }) {
  const [form, setForm] = useState({
    titulo: editando?.titulo || "",
    descripcion: editando?.descripcion || "",
    fecha: editando?.fecha || "",
    hora_inicio: editando?.hora_inicio || "",
    hora_fin: editando?.hora_fin || "",
    lugar: editando?.lugar || "",
    ponente: editando?.ponente || "",
    especialidad_ponente: editando?.especialidad_ponente || "",
    enlace_inscripcion: editando?.enlace_inscripcion || "",
    enlace_info: editando?.enlace_info || "",
    whatsapp_contacto: editando?.whatsapp_contacto || "",
    orden: editando?.orden ?? 0,
    imagen: editando?.imagen || null,
  });
  const [saving, setSaving] = useState(false);
  const [showFiler, setShowFiler] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(editando?.imagen_url || null);

  // Cropper state
  const [cropperSrc, setCropperSrc] = useState(null);
  const [cropperFolder, setCropperFolder] = useState("root");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.hora_inicio) delete payload.hora_inicio;
      if (!payload.hora_fin) delete payload.hora_fin;
      if (!payload.fecha) delete payload.fecha;
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleFilerSelect = (image) => {
    const fullUrl = getFullImageUrl(image.url);
    setCropperSrc(fullUrl);
    setCropperFolder(image.folder || "root");
    setShowFiler(false);
  };

  const handleCropComplete = async (blob) => {
    const { uploadImage } = await import("@/services/apis/media.js");
    const nombre = `evento-${Date.now()}.jpg`;
    const file = new File([blob], nombre, { type: "image/jpeg" });

    try {
      const uploaded = await uploadImage(file, cropperFolder);
      const imgUrl = uploaded.url || uploaded.file;
      setImagenPreview(imgUrl);
      setForm((f) => ({ ...f, imagen: uploaded.id }));
    } catch {
      // Si falla el upload, cerramos el cropper
    }
    setCropperSrc(null);
  };

  const inputClass = "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300";

  return (
    <>
      <Modal open={open} onClose={onClose} title={editando ? "Editar Evento" : "Nuevo Evento"} size="lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Imagen */}
          <Field label="Imagen / Flyer del evento">
            <div
              onClick={() => setShowFiler(true)}
              className="relative h-36 w-full rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all overflow-hidden"
            >
              {imagenPreview ? (
                <img src={imagenPreview} alt="Evento" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-1">
                  <Calendar size={24} className="text-slate-300 mx-auto" />
                  <p className="text-[11px] text-slate-400">Click para seleccionar imagen</p>
                </div>
              )}
            </div>
            {imagenPreview && (
              <button type="button" onClick={() => { setImagenPreview(null); setForm({ ...form, imagen: null }); }}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium mt-1">
                Quitar imagen
              </button>
            )}
          </Field>

          <Input
            label="Título *"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            maxLength={200}
            placeholder="Ej: Workshop de Implantes Dentales"
            required
          />

          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción breve del evento"
          />

          {/* Fecha y horario */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Fecha">
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Hora inicio">
              <input
                type="time"
                value={form.hora_inicio}
                onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Hora fin">
              <input
                type="time"
                value={form.hora_fin}
                onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Input
            label="Lugar"
            value={form.lugar}
            onChange={(e) => setForm({ ...form, lugar: e.target.value })}
            maxLength={300}
            placeholder="Ej: Hotel Guaraní, Asunción"
          />

          {/* Ponente */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ponente / Doctor"
              value={form.ponente}
              onChange={(e) => setForm({ ...form, ponente: e.target.value })}
              maxLength={200}
              placeholder="Ej: Dr. Carlos López"
            />
            <Input
              label="Especialidad"
              value={form.especialidad_ponente}
              onChange={(e) => setForm({ ...form, especialidad_ponente: e.target.value })}
              maxLength={200}
              placeholder="Ej: Implantología"
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Link de inscripción"
              type="url"
              value={form.enlace_inscripcion}
              onChange={(e) => setForm({ ...form, enlace_inscripcion: e.target.value })}
              placeholder="https://forms.google.com/..."
            />
            <Input
              label="Link más información"
              type="url"
              value={form.enlace_info}
              onChange={(e) => setForm({ ...form, enlace_info: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <Input
            label="WhatsApp de contacto"
            value={form.whatsapp_contacto}
            onChange={(e) => setForm({ ...form, whatsapp_contacto: e.target.value })}
            maxLength={20}
            placeholder="Ej: 595981123456"
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
              {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear evento"}
            </Button>
          </div>
        </form>
      </Modal>

      <FilerModal
        isOpen={showFiler}
        onClose={() => setShowFiler(false)}
        onSelectImage={handleFilerSelect}
      />

      <ImageCropper
        open={!!cropperSrc}
        imageSrc={cropperSrc}
        aspect={1}
        aspectLabel="1080×1080 (Instagram)"
        onCrop={handleCropComplete}
        onClose={() => setCropperSrc(null)}
      />
    </>
  );
}

// ─── Página principal ───────────────────────────────────────────

export default function EventosEcommercePage() {
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const { danger } = useConfirm();
  const { showToast } = useToast();

  const { data, loading, refetch } = useApi(() => getEventosAdmin(), { auto: true });

  const eventos = data?.results || data || [];

  const handleToggle = useCallback(async (id) => {
    try {
      await toggleEvento(id);
      showToast("Estado del evento actualizado", "success");
      refetch();
    } catch {
      showToast("No se pudo cambiar el estado", "error");
    }
  }, [refetch, showToast]);

  const handleCrear = useCallback(async (form) => {
    await crearEvento(form);
    showToast("Evento creado correctamente", "success");
    refetch();
  }, [refetch, showToast]);

  const handleEditar = useCallback(async (form) => {
    if (!editando) return;
    await actualizarEvento(editando.id, form);
    showToast("Evento actualizado", "success");
    setEditando(null);
    refetch();
  }, [editando, refetch, showToast]);

  const handleDelete = useCallback(async (evento) => {
    const ok = await danger(
      `¿Eliminar el evento "${evento.titulo}"? Esta acción no se puede deshacer.`,
      "Eliminar Evento",
      { confirmText: "Eliminar" }
    );
    if (!ok) return;
    try {
      await eliminarEvento(evento.id);
      showToast("Evento eliminado", "success");
      refetch();
    } catch {
      showToast("No se pudo eliminar el evento", "error");
    }
  }, [refetch, showToast, danger]);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        breadcrumbs={[
          { label: "E-commerce", href: "/ecommerce" },
          { label: "Eventos" },
        ]}
        subtitle="Gestionar eventos, workshops y capacitaciones"
        subtitleClassName="text-emerald-600"
      >
        <Button
          onClick={() => { setEditando(null); setShowModal(true); }}
          variant="primary"
          size="sm"
          icon={Plus}
          className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
        >
          Nuevo evento
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Stats */}
          {!loading && eventos.length > 0 && (
            <p className="text-xs text-slate-500">
              {eventos.length} evento{eventos.length !== 1 ? "s" : ""} · {eventos.filter(e => e.activo).length} activo{eventos.filter(e => e.activo).length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <LoadingScreen texto="Cargando eventos..." />
          ) : eventos.length === 0 ? (
            <EmptyState
              icon={<Calendar size={32} strokeWidth={1.5} />}
              titulo="Sin eventos"
              descripcion="Creá eventos para mostrar en la tienda online."
              textoBoton="Crear primer evento"
              onAction={() => { setEditando(null); setShowModal(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventos.map((e) => (
                <EventoCard
                  key={e.id}
                  evento={e}
                  onToggle={handleToggle}
                  onEdit={(ev) => { setEditando(ev); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal crear/editar */}
      {showModal && (
        <EventoModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSave={editando ? handleEditar : handleCrear}
          editando={editando}
        />
      )}
    </div>
  );
}
