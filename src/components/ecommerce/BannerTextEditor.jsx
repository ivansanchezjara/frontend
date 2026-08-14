"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Move, Type, AlignLeft, AlignCenter, AlignRight,
  Monitor, Smartphone, Minus, Plus,
} from "lucide-react";

/**
 * Editor visual de texto sobre banner con modos desktop/mobile independientes.
 *
 * Props:
 * - imagenUrl, imagenMobileUrl: URLs de las imágenes de fondo
 * - titulo, subtitulo, botonTexto: contenido de texto
 * - Desktop fields: textoX, textoY, textoAncho, fontSize, textoAlineacion
 * - Mobile fields: mobileTextoX, mobileTextoY, mobileTextoAncho, mobileFontSize, mobileTextoAlineacion
 * - onChange: (partialUpdate) => void — keys usan nombres del form padre
 */
export default function BannerTextEditor({
  imagenUrl,
  imagenMobileUrl,
  titulo,
  subtitulo,
  botonTexto,
  // Desktop
  textoX = 5,
  textoY = 50,
  textoAncho = 40,
  fontSize = 36,
  textoAlineacion = "left",
  // Mobile
  mobileTextoX = 5,
  mobileTextoY = 50,
  mobileTextoAncho = 80,
  mobileFontSize = 24,
  mobileTextoAlineacion = "center",
  onChange,
}) {
  const containerRef = useRef(null);
  const [preview, setPreview] = useState("desktop");

  // Valores actuales según el modo
  const isDesktop = preview === "desktop";
  const currentX = isDesktop ? textoX : mobileTextoX;
  const currentY = isDesktop ? textoY : mobileTextoY;
  const currentW = isDesktop ? textoAncho : mobileTextoAncho;
  const currentFont = isDesktop ? fontSize : mobileFontSize;
  const currentAlign = isDesktop ? textoAlineacion : mobileTextoAlineacion;

  // Prefijos de keys para onChange según modo
  const keyX = isDesktop ? "texto_x" : "mobile_texto_x";
  const keyY = isDesktop ? "texto_y" : "mobile_texto_y";
  const keyW = isDesktop ? "texto_ancho" : "mobile_texto_ancho";
  const keyFont = isDesktop ? "font_size" : "mobile_font_size";
  const keyAlign = isDesktop ? "texto_alineacion" : "mobile_texto_alineacion";

  // Refs para drag/resize
  const dragState = useRef({ active: false, offsetX: 0, offsetY: 0 });
  const resizeState = useRef({ active: false, startMouseX: 0, startWidth: 0 });
  const [, forceRender] = useState(0);

  // Refs para valores actuales (evitar closures stale)
  const valuesRef = useRef({ currentX, currentY, currentW, keyX, keyY, keyW });
  useEffect(() => {
    valuesRef.current = { currentX, currentY, currentW, keyX, keyY, keyW };
  }, [currentX, currentY, currentW, keyX, keyY, keyW]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const aspect = isDesktop ? 1920 / 600 : 1;
  const imgSrc = isDesktop ? imagenUrl : (imagenMobileUrl || imagenUrl);

  // ─── Drag ─────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest("[data-resize-handle]")) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const { currentX: x, currentY: y } = valuesRef.current;
    const currentPxX = (x / 100) * rect.width;
    const currentPxY = (y / 100) * rect.height;

    dragState.current = {
      active: true,
      offsetX: e.clientX - rect.left - currentPxX,
      offsetY: e.clientY - rect.top - currentPxY,
    };
    forceRender((n) => n + 1);
  }, []);

  const handleResizeDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = {
      active: true,
      startMouseX: e.clientX,
      startWidth: valuesRef.current.currentW,
    };
    forceRender((n) => n + 1);
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (dragState.current.active) {
        const { offsetX, offsetY } = dragState.current;
        const { currentW: w, keyX: kx, keyY: ky } = valuesRef.current;
        let newX = ((e.clientX - rect.left - offsetX) / rect.width) * 100;
        let newY = ((e.clientY - rect.top - offsetY) / rect.height) * 100;
        newX = Math.max(0, Math.min(100 - w, newX));
        newY = Math.max(2, Math.min(98, newY));
        onChangeRef.current({
          [kx]: Math.round(newX * 10) / 10,
          [ky]: Math.round(newY * 10) / 10,
        });
      }

      if (resizeState.current.active) {
        const { startMouseX, startWidth } = resizeState.current;
        const { currentX: x, keyW: kw } = valuesRef.current;
        const deltaPercent = ((e.clientX - startMouseX) / rect.width) * 100;
        let newWidth = startWidth + deltaPercent;
        newWidth = Math.max(15, Math.min(90, newWidth));
        if (x + newWidth > 100) newWidth = 100 - x;
        onChangeRef.current({ [kw]: Math.round(newWidth * 10) / 10 });
      }
    };

    const handleUp = () => {
      if (dragState.current.active || resizeState.current.active) {
        dragState.current.active = false;
        resizeState.current.active = false;
        forceRender((n) => n + 1);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  // ─── Font size ────────────────────────────────────────────────

  const adjustFontSize = (delta) => {
    const newSize = Math.max(12, Math.min(120, currentFont + delta));
    onChange({ [keyFont]: newSize });
  };

  // ─── Scale factor ─────────────────────────────────────────────
  const [scaleFactor, setScaleFactor] = useState(1);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const realWidth = isDesktop ? 1920 : 1080;
    const obs = new ResizeObserver(([entry]) => {
      setScaleFactor(entry.contentRect.width / realWidth);
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, [isDesktop]);

  const scaledFont = Math.max(10, Math.round(currentFont * scaleFactor));
  const scaledSubFont = Math.max(8, Math.round((currentFont * 0.45) * scaleFactor));

  const alignClass = currentAlign === "center" ? "text-center" : currentAlign === "right" ? "text-right" : "text-left";
  const isDragging = dragState.current.active;
  const isResizing = resizeState.current.active;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Preview mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setPreview("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
              preview === "desktop" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Monitor size={12} /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setPreview("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
              preview === "mobile" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Smartphone size={12} /> Mobile
          </button>
        </div>

        {/* Font size */}
        <div className="flex items-center gap-1.5">
          <Type size={12} className="text-slate-400" />
          <button
            type="button"
            onClick={() => adjustFontSize(-4)}
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <Minus size={10} />
          </button>
          <span className="text-[11px] font-bold text-slate-600 w-8 text-center">{currentFont}</span>
          <button
            type="button"
            onClick={() => adjustFontSize(4)}
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <Plus size={10} />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {[
            { val: "left", Icon: AlignLeft },
            { val: "center", Icon: AlignCenter },
            { val: "right", Icon: AlignRight },
          ].map(({ val, Icon }) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange({ [keyAlign]: val })}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                currentAlign === val ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={12} />
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full bg-slate-200 rounded-xl overflow-hidden border border-slate-300 select-none"
        style={{ aspectRatio: aspect }}
      >
        {/* Imagen de fondo */}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-slate-400">Sin imagen — subí una para previsualizar</p>
          </div>
        )}

        {/* Grid guide */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10" />
        </div>

        {/* Draggable text block */}
        {(titulo || subtitulo || botonTexto) && (
          <div
            onMouseDown={handleMouseDown}
            className={`absolute group ${alignClass}`}
            style={{
              left: `${currentX}%`,
              top: `${currentY}%`,
              width: `${currentW}%`,
              cursor: isDragging ? "grabbing" : "grab",
              transform: "translateY(-50%)",
            }}
          >
            <div className={`relative bg-black/40 backdrop-blur-sm rounded-xl border-2 transition-colors ${
              isDragging || isResizing ? "border-emerald-400" : "border-transparent group-hover:border-emerald-400/60"
            }`} style={{ padding: `${scaledFont * 0.8}px ${scaledFont * 1.2}px` }}>
              {/* Drag indicator */}
              <div className={`absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${isDragging ? "!opacity-100" : ""}`}>
                <Move size={9} /> Arrastrar
              </div>

              {titulo && (
                <p className="text-white font-bold leading-tight" style={{ fontSize: `${scaledFont}px` }}>
                  {titulo}
                </p>
              )}
              {subtitulo && (
                <p className="text-white/80 mt-1 leading-snug" style={{ fontSize: `${scaledSubFont}px` }}>
                  {subtitulo}
                </p>
              )}
              {botonTexto && (
                <div className={`mt-2 ${currentAlign === "center" ? "flex justify-center" : currentAlign === "right" ? "flex justify-end" : ""}`}>
                  <span
                    className="inline-flex items-center gap-1 bg-white text-slate-800 rounded-full font-bold"
                    style={{ fontSize: `${Math.max(8, scaledFont * 0.4)}px`, padding: `${scaledFont * 0.4}px ${scaledFont * 1}px` }}
                  >
                    {botonTexto}
                  </span>
                </div>
              )}

              {/* Resize handle */}
              <div
                data-resize-handle="true"
                onMouseDown={handleResizeDown}
                className={`absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-10 flex items-center justify-center cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity ${isResizing ? "!opacity-100" : ""}`}
              >
                <div className="w-1 h-6 bg-emerald-400 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!titulo && !subtitulo && !botonTexto && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-white/60 bg-black/30 px-3 py-1.5 rounded-lg">
              Escribí un título para posicionarlo aquí
            </p>
          </div>
        )}
      </div>

      {/* Position info */}
      <div className="flex items-center gap-4 text-[10px] text-slate-400">
        <span className="font-bold text-slate-500">{isDesktop ? "Desktop" : "Mobile"}:</span>
        <span>X: {currentX.toFixed(1)}%</span>
        <span>Y: {currentY.toFixed(1)}%</span>
        <span>Ancho: {currentW.toFixed(1)}%</span>
        <span>Fuente: {currentFont}px</span>
      </div>
    </div>
  );
}
