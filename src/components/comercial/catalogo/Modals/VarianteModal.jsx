"use client";
import { FilerModal, Button, Heading, Text, Input } from '@/components/ui';
import { useState } from "react";
import { Trash2, X, Plus, Loader2 } from "lucide-react";
import {
  crearVariante,
  actualizarVariante,
  crearImagenProducto,
  eliminarImagenProducto,
  getFullImageUrl,
} from "@/services/apis/catalogo.js";
import Field from "@/components/comercial/catalogo/Field";

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
          <Heading level={4}>
            {isNew ? "Nueva Variante" : "Editar Variante"}
          </Heading>
          <Text variant="muted" className="mt-0.5">
            Los precios se gestionan desde <strong className="font-semibold text-slate-700">Inventario y Precios</strong>.
          </Text>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-medium">
              {error}
            </div>
          )}

          <Input
            autoFocus
            label="Nombre de la Variante"
            placeholder="Ej: #1 Mini Extra-Flex"
            value={form.nombre_variante}
            onChange={(e) => handleNombre(e.target.value)}
          />

          <Input
            label="Código SKU"
            helperText="Debe ser único en todo el catálogo."
            className="font-mono"
            placeholder="Ej: TH-CU-001"
            value={form.product_code}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                product_code: e.target.value.toUpperCase(),
              }))
            }
          />

          <Input
            label="Sub-Slug (URL)"
            helperText="Se auto-genera desde el nombre. Podés editarlo manualmente."
            className="font-mono"
            placeholder="Ej: 1-mini-extra-flex"
            value={form.sub_slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((p) => ({ ...p, sub_slug: e.target.value }));
            }}
          />

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilerOpen(true)}
              >
                {selectedImg ? "Cambiar Foto" : "Elegir del Filer"}
              </Button>
              {selectedImg && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedImg(null);
                    setForm((p) => ({ ...p, imagen_variante: null }));
                  }}
                >
                  Quitar
                </Button>
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
              <Text variant="label" className="block mb-3">
                Galería Extra
              </Text>
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
                    <Button
                      variant="danger"
                      size="icon"
                      icon={Trash2}
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsGalleryFilerOpen(true)}
                  className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all cursor-pointer bg-slate-50 group"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin text-emerald-500 shrink-0" />
                  ) : (
                    <Plus size={16} className="group-hover:scale-110 transition-transform text-slate-400 group-hover:text-emerald-500 shrink-0" />
                  )}
                  <Text variant="label" className="group-hover:text-emerald-500 transition-colors text-[9px] text-center leading-none px-1">
                    {saving ? "..." : "Nueva"}
                  </Text>
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
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            variant="primary"
            className="flex-1"
          >
            {saving ? "Guardando..." : isNew ? "Crear Variante" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
