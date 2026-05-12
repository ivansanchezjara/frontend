"use client";
import { useState } from "react";
import {
  crearVariante,
  actualizarVariante,
  crearImagenProducto,
  eliminarImagenProducto,
} from "@/services/apis/catalogo.js";
import FilerModal from "@/components/ui/FilerModal";
import { getFullImageUrl } from "@/services/apis/catalogo.js";
import Field from "@/components/comercial/catalogo/Field";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400";

export default function VarianteModal({
  variante,
  productoId,
  onClose,
  onSave,
  onRefresh,
}) {
  const isNew = !variante?.id;
  const autoSlugify = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const [form, setForm] = useState({
    nombre_variante: variante?.nombre_variante || "",
    product_code: variante?.product_code || "",
    sub_slug: variante?.sub_slug || "",
    imagen_variante: variante?.imagen_variante || null,
  });
  const [selectedImg, setSelectedImg] = useState(
    variante?.imagen_url ? { url: variante.imagen_url } : null,
  );
  const [isFilerOpen, setIsFilerOpen] = useState(false);
  const [isGalleryFilerOpen, setIsGalleryFilerOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleAddImage = async (img) => {
    setSaving(true);
    try {
      await crearImagenProducto({
        variante: variante.id,
        imagen_asset: img.id,
        orden: variante.imagenes?.length || 0,
      });
      onRefresh();
    } catch (e) {
      alert("Error al agregar imagen a la galería.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (id) => {
    if (!confirm("¿Quitar esta imagen de la galería?")) return;
    try {
      await eliminarImagenProducto(id);
      onRefresh();
    } catch (e) {
      alert("Error al eliminar.");
    }
  };

  const handleNombre = (value) => {
    setForm((prev) => ({
      ...prev,
      nombre_variante: value,
      sub_slug: !slugTouched ? autoSlugify(value) : prev.sub_slug,
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = isNew ? { ...form, producto_padre: productoId } : form;
      const result = isNew
        ? await crearVariante(payload)
        : await actualizarVariante(variante.id, form);
      onSave(result, isNew);
    } catch (err) {
      const msg =
        typeof err === "object"
          ? Object.entries(err)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : "Error al guardar.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    form.nombre_variante.trim() && form.product_code.trim() && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-900">
            {isNew ? "Nueva Variante" : "Editar Variante"}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Los precios se gestionan desde <strong>Inventario y Precios</strong>
            .
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-medium">
              {error}
            </div>
          )}

          <Field label="Nombre de la Variante">
            <input
              autoFocus
              className={inputClass}
              placeholder="Ej: #1 Mini Extra-Flex"
              value={form.nombre_variante}
              onChange={(e) => handleNombre(e.target.value)}
            />
          </Field>

          <Field label="Código SKU" hint="Debe ser único en todo el catálogo.">
            <input
              className={`${inputClass} font-mono`}
              placeholder="Ej: TH-CU-001"
              value={form.product_code}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  product_code: e.target.value.toUpperCase(),
                }))
              }
            />
          </Field>

          <Field
            label="Sub-Slug (URL)"
            hint="Se auto-genera desde el nombre. Podés editarlo manualmente."
          >
            <input
              className={`${inputClass} font-mono`}
              placeholder="Ej: 1-mini-extra-flex"
              value={form.sub_slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((p) => ({ ...p, sub_slug: e.target.value }));
              }}
            />
          </Field>

          <Field label="Imagen de Referencia (SKU)">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
                {selectedImg ? (
                  <img
                    src={getFullImageUrl(selectedImg.url)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-slate-300">
                    🏜️
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFilerOpen(true)}
                className="text-[11px] font-black text-blue-600 uppercase hover:underline"
              >
                {selectedImg ? "Cambiar Foto" : "Elegir del Filer"}
              </button>
              {selectedImg && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImg(null);
                    setForm((p) => ({ ...p, imagen_variante: null }));
                  }}
                  className="text-[11px] font-black text-red-500 uppercase hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </Field>

          <FilerModal
            isOpen={isFilerOpen}
            onClose={() => setIsFilerOpen(false)}
            initialSearch={form.product_code}
            onSelectImage={(img) => {
              setSelectedImg(img);
              setForm((p) => ({ ...p, imagen_variante: img.id }));
              setIsFilerOpen(false);
            }}
          />

          {!isNew && (
            <div className="pt-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-3">
                Galería Extra
              </label>
              <div className="grid grid-cols-4 gap-3">
                {variante.imagenes?.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square"
                  >
                    <img
                      src={getFullImageUrl(img.url)}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3 h-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsGalleryFilerOpen(true)}
                  className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all cursor-pointer bg-slate-50"
                >
                  <span className="text-xl">{saving ? "⌛" : "📸"}</span>
                  <span className="text-[9px] font-black uppercase text-center leading-none px-1">
                    Nueva
                  </span>
                </button>
              </div>
            </div>
          )}

          <FilerModal
            isOpen={isGalleryFilerOpen}
            onClose={() => setIsGalleryFilerOpen(false)}
            initialSearch={form.product_code}
            onSelectImage={(img) => {
              handleAddImage(img);
              setIsGalleryFilerOpen(false);
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? "Guardando..." : isNew ? "Crear Variante" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
