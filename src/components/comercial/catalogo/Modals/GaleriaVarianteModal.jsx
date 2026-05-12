"use client";
import { useState } from "react";
import {
  crearImagenProducto,
  eliminarImagenProducto,
} from "@/services/apis/catalogo.js";

import FilerModal from "@/components/ui/FilerModal";
import { getFullImageUrl } from "@/services/apis/catalogo.js";

export default function GaleriaVarianteModal({ variante, onClose, onRefresh }) {
  const [isFilerOpen, setIsFilerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleDelete = async (id) => {
    if (!confirm("¿Quitar esta imagen de la galería?")) return;
    try {
      await eliminarImagenProducto(id);
      onRefresh();
    } catch (e) {
      alert("Error al eliminar.");
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
            <h3 className="text-lg font-black text-slate-900">Galería Extra</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fotos adicionales para <strong>{variante.nombre_variante}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            ✕
          </button>
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
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
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
              disabled={saving}
              onClick={() => setIsFilerOpen(true)}
              className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all cursor-pointer"
            >
              <span className="text-2xl">{saving ? "⌛" : "📸"}</span>
              <span className="text-[10px] font-black uppercase">
                Nueva Foto
              </span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs"
          >
            Cerrar
          </button>
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
