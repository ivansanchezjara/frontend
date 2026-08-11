"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Button from "../basics/Button";
import { Text } from "../basics/Typography";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

/**
 * Recorta una imagen en el browser usando Canvas.
 * @param {string} imageSrc - URL o data URL de la imagen original
 * @param {{ x, y, width, height }} cropArea - Área de recorte en píxeles
 * @returns {Promise<Blob>} - Imagen recortada como Blob
 */
async function getCroppedImg(imageSrc, cropArea) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    cropArea.x, cropArea.y, cropArea.width, cropArea.height,
    0, 0, cropArea.width, cropArea.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

/**
 * ImageCropper — Modal de recorte con aspect ratio fijo.
 *
 * Props:
 * - open: boolean
 * - imageSrc: string (URL o data URL de la imagen a recortar)
 * - aspect: number (ej: 1920/600 para desktop, 1 para mobile)
 * - aspectLabel: string (ej: "1920×600" — informativo)
 * - onCrop: (blob: Blob) => void — callback con la imagen recortada
 * - onClose: () => void
 */
export default function ImageCropper({
  open, imageSrc, aspect = 16 / 5, aspectLabel = "",
  onCrop, onClose,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCrop(blob);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-3">
        <div>
          <Text className="text-white text-sm font-bold">Ajustar imagen</Text>
          {aspectLabel && (
            <Text className="text-white/60 text-xs">
              Tamaño objetivo: {aspectLabel}
            </Text>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-xl leading-none px-2"
        >
          ✕
        </button>
      </div>

      {/* Cropper area */}
      <div className="relative w-full max-w-3xl aspect-video bg-gray-900 rounded-xl overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={true}
          style={{
            containerStyle: { borderRadius: "0.75rem" },
          }}
        />
      </div>

      {/* Controls */}
      <div className="w-full max-w-3xl flex items-center justify-between mt-4 gap-4">
        {/* Zoom slider */}
        <div className="flex items-center gap-3 flex-1">
          <ZoomOut size={16} className="text-white/60 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-emerald-500 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
          />
          <ZoomIn size={16} className="text-white/60 shrink-0" />

          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="ml-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
            title="Rotar 90°"
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
          >
            {saving ? "Procesando..." : "Confirmar recorte"}
          </Button>
        </div>
      </div>
    </div>
  );
}
