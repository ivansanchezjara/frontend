"use client";
import { useState, useCallback } from "react";
import {
  Plus, Search, Pencil, Globe, Trash2, Package,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import {
  getMarcas, crearMarca, actualizarMarca, eliminarMarca, getFullImageUrl,
} from "@/services/apis/catalogo.js";
import {
  PageHeader, EmptyState, LoadingScreen,
  Modal, Button, Input, Field, Text, Badge, FilerModal, useConfirm,
} from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";

// ─── Tarjeta de marca ───────────────────────────────────────────

function MarcaCard({ marca, onEdit, onDelete, onToggleActivo }) {
  const logoUrl = marca.logo_url ? getFullImageUrl(marca.logo_url) : null;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border bg-white transition-all group ${
      marca.activo
        ? "border-slate-200 hover:border-slate-300 hover:shadow-sm"
        : "border-slate-200/60 opacity-60"
    }`}>
      {/* Logo */}
      <div className="w-14 h-14 shrink-0 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
        {logoUrl ? (
          <img src={logoUrl} alt={marca.nombre} className="w-full h-full object-contain p-1.5" />
        ) : (
          <Text className="text-slate-300 font-black text-xl select-none">
            {marca.nombre.charAt(0).toUpperCase()}
          </Text>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text className="text-sm font-bold text-slate-800 truncate">
            {marca.nombre}
          </Text>
          {!marca.activo && (
            <Badge className="text-[9px] bg-red-50 text-red-500 border-red-100">
              Inactiva
            </Badge>
          )}
        </div>
        {marca.descripcion && (
          <Text variant="bodyXs" className="text-slate-500 mt-0.5 truncate">
            {marca.descripcion}
          </Text>
        )}
        <div className="flex items-center gap-3 mt-1">
          {marca.sitio_web && (
            <a
              href={marca.sitio_web}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline"
            >
              <Globe size={10} />
              Sitio web
            </a>
          )}
          {marca.productos_count != null && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Package size={10} />
              {marca.productos_count} producto{marca.productos_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggleActivo(marca)}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
            marca.activo
              ? "hover:bg-amber-50 text-slate-400 hover:text-amber-600"
              : "hover:bg-green-50 text-slate-400 hover:text-green-600"
          }`}
          title={marca.activo ? "Desactivar" : "Activar"}
        >
          {marca.activo ? "Desactivar" : "Activar"}
        </button>
        <button
          onClick={() => onEdit(marca)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          title="Editar"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(marca)}
          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Modal crear/editar marca ───────────────────────────────────

function MarcaModal({ open, onClose, onSave, editando }) {
  const [form, setForm] = useState({
    nombre: editando?.nombre || "",
    descripcion: editando?.descripcion || "",
    sitio_web: editando?.sitio_web || "",
    logo: editando?.logo || null,
    activo: editando?.activo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [isFilerOpen, setIsFilerOpen] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(
    editando?.logo_url ? { url: editando.logo_url } : null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleFilerSelect = (image) => {
    setSelectedLogo({ url: image.url });
    setForm({ ...form, logo: image.id });
    setIsFilerOpen(false);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={editando ? "Editar Marca" : "Nueva Marca"}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Logo preview */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => setIsFilerOpen(true)}
              className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all overflow-hidden"
            >
              {selectedLogo?.url ? (
                <img src={getFullImageUrl(selectedLogo.url)} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Text variant="bodyXs" className="text-slate-400 text-center px-1">
                  + Logo
                </Text>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Text variant="bodyXs" className="text-slate-500">
                Hacé clic para seleccionar un logo desde el gestor de medios.
                Recomendado: PNG con fondo transparente.
              </Text>
              {selectedLogo?.url && (
                <button
                  type="button"
                  onClick={() => { setSelectedLogo(null); setForm({ ...form, logo: null }); }}
                  className="text-[10px] text-red-500 hover:text-red-700 font-medium"
                >
                  Quitar logo
                </button>
              )}
            </div>
          </div>

          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Thalys"
            required
          />

          <Field label="Descripción">
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Breve descripción de la marca (opcional)"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
          </Field>

          <Input
            label="Sitio Web"
            type="url"
            value={form.sitio_web}
            onChange={(e) => setForm({ ...form, sitio_web: e.target.value })}
            placeholder="https://www.marca.com"
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!form.nombre.trim() || saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            >
              {saving ? "Guardando..." : editando ? "Guardar" : "Crear marca"}
            </Button>
          </div>
        </form>
      </Modal>

      <FilerModal
        isOpen={isFilerOpen}
        onClose={() => setIsFilerOpen(false)}
        onSelectImage={handleFilerSelect}
      />
    </>
  );
}

// ─── Página principal ───────────────────────────────────────────

export default function MarcasPage() {
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const { danger } = useConfirm();
  const { showToast } = useToast();

  const { data, loading, refetch } = useApi(getMarcas, { auto: true, initialData: [] });

  const marcas = (Array.isArray(data) ? data : data?.results || [])
    .filter((m) =>
      !busqueda || m.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      // Activas primero, luego alfabético
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return a.nombre.localeCompare(b.nombre);
    });

  const handleCrear = useCallback(async (form) => {
    await crearMarca(form);
    showToast("Marca creada correctamente", "success");
    refetch();
  }, [refetch, showToast]);

  const handleEditar = useCallback(async (form) => {
    if (!editando) return;
    await actualizarMarca(editando.id, form);
    showToast("Marca actualizada", "success");
    setEditando(null);
    refetch();
  }, [editando, refetch, showToast]);

  const handleDelete = useCallback(async (marca) => {
    const ok = await danger(
      `¿Eliminar la marca "${marca.nombre}"? Los productos asociados quedarán sin marca.`,
      "Eliminar Marca",
      { confirmText: "Eliminar" }
    );
    if (!ok) return;
    try {
      await eliminarMarca(marca.id);
      showToast("Marca eliminada", "success");
      refetch();
    } catch (err) {
      showToast(err?.data?.detail || "No se pudo eliminar la marca", "error");
    }
  }, [refetch, showToast, danger]);

  const handleToggleActivo = useCallback(async (marca) => {
    try {
      await actualizarMarca(marca.id, { activo: !marca.activo });
      showToast(
        marca.activo ? "Marca desactivada" : "Marca activada",
        "success"
      );
      refetch();
    } catch {
      showToast("No se pudo cambiar el estado", "error");
    }
  }, [refetch, showToast]);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        breadcrumbs={[
          { label: "Catálogo Master", href: "/catalogo" },
          { label: "Marcas" },
        ]}
        subtitle="Gestión de marcas comerciales"
        subtitleClassName="text-emerald-600"
      >
        <Button
          onClick={() => { setEditando(null); setShowModal(true); }}
          variant="primary"
          size="sm"
          icon={Plus}
          className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
        >
          Nueva marca
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Búsqueda + stats */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-xs flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar marca..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
              />
            </div>
            {!loading && marcas.length > 0 && (
              <Text variant="bodyXs" className="text-slate-400 shrink-0">
                {marcas.length} marca{marcas.length !== 1 ? "s" : ""}
              </Text>
            )}
          </div>

          {/* Contenido */}
          {loading ? (
            <LoadingScreen texto="Cargando marcas..." />
          ) : marcas.length === 0 ? (
            <EmptyState
              icon={<Text className="text-3xl">🏷️</Text>}
              titulo={busqueda ? "Sin resultados" : "Sin marcas"}
              descripcion={
                busqueda
                  ? "No hay marcas que coincidan con la búsqueda."
                  : "Creá la primera marca para asociar a tus productos."
              }
              textoBoton={!busqueda ? "Crear primera marca" : undefined}
              onAction={!busqueda ? () => { setEditando(null); setShowModal(true); } : undefined}
            />
          ) : (
            <div className="space-y-2">
              {marcas.map((marca) => (
                <MarcaCard
                  key={marca.id}
                  marca={marca}
                  onEdit={(m) => { setEditando(m); setShowModal(true); }}
                  onDelete={handleDelete}
                  onToggleActivo={handleToggleActivo}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal crear/editar */}
      {showModal && (
        <MarcaModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSave={editando ? handleEditar : handleCrear}
          editando={editando}
        />
      )}
    </div>
  );
}
