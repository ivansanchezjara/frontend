"use client";
import { FilerModal, Button, Heading, Text, useConfirm, useToast } from '@/components/ui';
import { useState } from "react";
import { Trash2, X, Plus, Loader2 } from "lucide-react";
import {
  crearImagenProducto,
  eliminarImagenProducto,
  getFullImageUrl,
} from "@/services/apis/catalogo.js";

export default function GaleriaVarianteModal({ variante, onClose, onRefresh }) {
  const [isFilerOpen, setIsFilerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { danger: showConfirm } = useConfirm();
  const { showToast } = useToast();

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
      showToast("Error al agregar imagen a la galería.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      "¿Quitar esta imagen de la galería?",
      "Quitar imagen",
      { confirmText: "Quitar" }
    );
    if (!confirmed) return;
    try {
      await eliminarImagenProducto(id);
      onRefresh();
    } catch (e) {
      showToast("Error al eliminar imagen.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[80vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <Heading level={4}>Galería Extra</Heading>
            <Text variant="muted" className="mt-0.5">
              Fotos adicionales para <strong className="font-semibold text-slate-700">{variante.nombre_variante}</strong>
            </Text>
          </div>
          <Button
            variant="ghost"
            size="icon"
            icon={X}
            onClick={onClose}
            className="rounded-full"
          />
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {variante.imagenes?.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square"
              >
                <img
                  src={getFullImageUrl(img.url)}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="danger"
                  size="icon"
                  icon={Trash2}
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
            <button
              type="button"
              disabled={saving}
              onClick={() => setIsFilerOpen(true)}
              className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all cursor-pointer group"
            >
              {saving ? (
                <Loader2 size={24} className="animate-spin text-emerald-500 shrink-0" />
              ) : (
                <Plus size={24} className="group-hover:scale-110 transition-transform text-slate-400 group-hover:text-emerald-500 shrink-0" />
              )}
              <Text variant="label" className="group-hover:text-emerald-500 transition-colors">
                {saving ? "Guardando..." : "Nueva Foto"}
              </Text>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button onClick={onClose} variant="primary">
            Cerrar
          </Button>
        </div>

        <FilerModal
          isOpen={isFilerOpen}
          onClose={() => setIsFilerOpen(false)}
          initialSearch={variante.product_code}
          onSelectImage={handleAddImage}
        />
      </div>
    </div>
  );
}
