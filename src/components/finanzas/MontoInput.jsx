"use client";

import { useState, useRef } from "react";

/**
 * Input de monto con formato visual de miles (separador de punto).
 * Internamente guarda el valor numérico limpio como string.
 *
 * Props:
 * - value: string (valor numérico limpio, ej: "1500000")
 * - onChange: (valorLimpio: string) => void
 * - moneda: "PYG" | "USD" | "BRL" — controla decimales
 * - ...rest: se pasa al input
 */
export default function MontoInput({ value, onChange, moneda = "PYG", ...rest }) {
  const inputRef = useRef(null);

  // PYG no usa decimales, USD y BRL sí
  const usaDecimales = moneda !== "PYG";

  // Formatear para display: 1500000 → 1.500.000 (PYG) o 1.500,00 (USD/BRL)
  function formatearDisplay(val) {
    if (!val && val !== 0) return "";
    const str = String(val);

    if (usaDecimales) {
      // Separar parte entera y decimal
      const partes = str.split(".");
      const entera = partes[0] || "";
      const decimal = partes[1] ?? "";
      const enteraFormateada = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      if (str.includes(".") || decimal) {
        return enteraFormateada + "," + decimal;
      }
      return enteraFormateada;
    }

    // Sin decimales (PYG): solo separador de miles
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Parsear input del usuario → valor limpio
  function limpiarInput(texto) {
    if (usaDecimales) {
      // Quitar puntos de miles, reemplazar coma decimal por punto
      let limpio = texto.replace(/\./g, "").replace(",", ".");
      // Permitir solo dígitos, un punto decimal
      limpio = limpio.replace(/[^\d.]/g, "");
      // Solo un punto decimal
      const partes = limpio.split(".");
      if (partes.length > 2) {
        limpio = partes[0] + "." + partes.slice(1).join("");
      }
      // Limitar a 2 decimales
      if (partes.length === 2 && partes[1].length > 2) {
        limpio = partes[0] + "." + partes[1].slice(0, 2);
      }
      return limpio;
    }
    // PYG: solo dígitos enteros
    return texto.replace(/[^\d]/g, "");
  }

  const [displayValue, setDisplayValue] = useState(() => formatearDisplay(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sincronizar cuando cambia value externamente (no durante foco)
  const prevValueRef = useRef(value);
  if (!isFocused && value !== prevValueRef.current) {
    prevValueRef.current = value;
    setDisplayValue(formatearDisplay(value));
  }

  const handleChange = (e) => {
    const raw = e.target.value;
    const limpio = limpiarInput(raw);

    // Actualizar display con lo que el usuario escribió (limpiando caracteres inválidos)
    setDisplayValue(raw.replace(/[^\d.,]/g, ""));

    // Emitir valor limpio
    onChange(limpio);
    prevValueRef.current = limpio;
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Mostrar valor sin formato para editar más fácil
    if (usaDecimales && value) {
      // Mostrar con coma decimal para es-PY
      setDisplayValue(value.includes(".") ? value.replace(".", ",") : value);
    } else {
      setDisplayValue(value || "");
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Re-formatear al perder foco
    setDisplayValue(formatearDisplay(value));
  };

  const prefix = moneda === "PYG" ? "₲" : moneda === "BRL" ? "R$" : "US$";

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
        {prefix}
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode={usaDecimales ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-right font-mono"
        placeholder={usaDecimales ? "0,00" : "0"}
        autoComplete="off"
        {...rest}
      />
    </div>
  );
}
