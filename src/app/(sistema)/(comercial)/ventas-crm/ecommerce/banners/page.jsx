"use client";
import { useState, useCallback } from "react";
import {
  Image as ImageIcon, Plus, Eye, EyeOff, GripVertical,
  ChevronLeft, ExternalLink, Calendar,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getBannersAdmin, toggleBanner, crearBanner } from "@/services/apis/ecommerce";
import { PageHeader, EmptyState, LoadingScreen, Modal, Button } from "@/components/ui";

// ─── Tarjeta de banner ──────────────────────────────────────────

function BannerCard({ banner, onToggle }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(banner.id);
    } finally {
      setToggling(false);
    }
  };

  const ubicacionLabel = {
    hero: "Hero principal",
    secundario: "Secundario",
    popup: "Popup",
  };

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white transition-colors ${
      banner.activo ? "border-slate-200" : "border-slate-200 opacity-60"
    }`}>
      {/* Imagen preview */}
      <div className="relative h-32 bg-slate-100">
        {banner.imagen_url ? (
          <img
            src={banner.imagen_url}
            alt={banner.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-slate-300" />
          </div>
        )}
        {/* Badge de ubicación */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-600 shadow-sm">
          {ubicacionLabel[banner.ubicacion] || banner.ubicacion}
        </span>
        {/* Badge de estado */}
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
            <p className="text-sm font-bold text-slate-800 truncate">{banner.titulo}</p>
            {banner.subtitulo && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{banner.subtitulo}</p>
            )}
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">#{banner.orden}</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3">
          {banner.enlace && (
            <a
              href={banner.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline"
            >
              <ExternalLink size={10} />
              Link
            </a>
          )}
          {(banner.fecha_inicio || banner.fecha_fin) && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar size={10} />
              Programado
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
        </div>
      </div>
    </div>
  );
}

// ─── Modal crear banner ─────────────────────────────────────────

function CrearBannerModal({ open, onClose, onCrear }) {
  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    enlace: "",
    boton_texto: "",
    ubicacion: "hero",
    orden: 0,
  });
  const [creando, setCreando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setCreando(true);
    try {
      await onCrear(form);
      setForm({ titulo: "", subtitulo: "", enlace: "", boton_texto: "", ubicacion: "hero", orden: 0 });
      onClose();
    } finally {
      setCreando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Banner">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Título *</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            maxLength={100}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Subtítulo</label>
          <input
            type="text"
            value={form.subtitulo}
            onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
            maxLength={200}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ubicación</label>
            <select
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              <option value="hero">Hero principal</option>
              <option value="secundario">Secundario</option>
              <option value="popup">Popup</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Orden</label>
            <input
              type="number"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
              min={0}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Enlace (URL)</label>
          <input
            type="url"
            value={form.enlace}
            onChange={(e) => setForm({ ...form, enlace: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Texto del botón</label>
          <input
            type="text"
            value={form.boton_texto}
            onChange={(e) => setForm({ ...form, boton_texto: e.target.value })}
            maxLength={30}
            placeholder="Ver más"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <p className="text-[10px] text-slate-400">
          La imagen se asigna después de crear, desde el gestor de medios.
        </p>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!form.titulo.trim() || creando}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
          >
            {creando ? "Creando..." : "Crear banner"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Página principal ───────────────────────────────────────────

export default function BannersEcommercePage() {
  const [showCrear, setShowCrear] = useState(false);

  const { data, loading, refetch } = useApi(
    () => getBannersAdmin(),
    []
  );

  const handleToggle = useCallback(async (id) => {
    await toggleBanner(id);
    refetch();
  }, [refetch]);

  const handleCrear = useCallback(async (form) => {
    await crearBanner(form);
    refetch();
  }, [refetch]);

  const banners = data?.results || data || [];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        title="Banners de la Tienda"
        subtitle="Gestionar carousel y promociones"
        subtitleClassName="text-emerald-600"
        backHref="/ventas-crm/ecommerce"
        backIcon={ChevronLeft}
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header con botón crear */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {banners.length} banner{banners.length !== 1 ? "s" : ""} configurado{banners.length !== 1 ? "s" : ""}
            </p>
            <Button
              onClick={() => setShowCrear(true)}
              variant="primary"
              size="sm"
              icon={Plus}
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            >
              Nuevo banner
            </Button>
          </div>

          {/* Grid */}
          {loading ? (
            <LoadingScreen texto="Cargando banners..." />
          ) : banners.length === 0 ? (
            <EmptyState
              icon={<ImageIcon size={32} strokeWidth={1.5} />}
              titulo="Sin banners"
              descripcion="Creá banners para el carousel de la tienda."
              textoBoton="Crear primer banner"
              onAction={() => setShowCrear(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((b) => (
                <BannerCard key={b.id} banner={b} onToggle={handleToggle} />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal crear */}
      <CrearBannerModal
        open={showCrear}
        onClose={() => setShowCrear(false)}
        onCrear={handleCrear}
      />
    </div>
  );
}
