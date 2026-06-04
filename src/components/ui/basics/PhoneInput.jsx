"use client";
import { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { Text } from "./Typography";

// ─── Prefijos soportados ────────────────────────────────────────
// min/max se refieren a la cantidad de dígitos del número LOCAL (sin el prefijo)

export const PHONE_PREFIXES = [
  {
    code: "+595",
    country: "PY",
    flag: "🇵🇾",
    label: "Paraguay",
    placeholder: "981 000 000",
    min: 7,
    max: 9,
  },
  {
    code: "+55",
    country: "BR",
    flag: "🇧🇷",
    label: "Brasil",
    placeholder: "11 91234 5678",
    min: 10,
    max: 11,
  },
  {
    code: "+54",
    country: "AR",
    flag: "🇦🇷",
    label: "Argentina",
    placeholder: "11 1234 5678",
    min: 10,
    max: 10,
  },
  {
    code: "+other",
    country: "OTHER",
    flag: "🌐",
    label: "Otro",
    placeholder: "000 000 000",
    min: 5,
    max: 15,
  },
];

/**
 * Valida un número de teléfono según el prefijo seleccionado.
 * Retorna null si es válido, o un string con el mensaje de error.
 */
export function validatePhone(prefix, number) {
  if (!number.trim()) return null; // vacío = campo opcional, se maneja fuera

  const config = PHONE_PREFIXES.find((p) => p.code === prefix);
  const digits = number.replace(/\D/g, "");

  if (!/^[0-9\s\-\(\)]+$/.test(number)) {
    return "Solo se permiten números, espacios y - ( ).";
  }
  if (!config || config.code === "+other") {
    if (digits.length < 5) return "Número demasiado corto.";
    if (digits.length > 15) return "Número demasiado largo.";
    return null;
  }
  if (digits.length < config.min) {
    return `Muy corto para ${config.label} (mín. ${config.min} dígitos).`;
  }
  if (digits.length > config.max) {
    return `Muy largo para ${config.label} (máx. ${config.max} dígitos).`;
  }
  return null;
}

/**
 * Devuelve el valor combinado "+595 981000000" para guardar en el backend.
 */
export function buildPhoneValue(prefix, number) {
  if (!number.trim()) return "";
  const code = prefix === "+other" ? "" : prefix;
  return code ? `${code} ${number.trim()}` : number.trim();
}

/**
 * PhoneInput — input de teléfono con selector de prefijo de país.
 *
 * Props:
 * - label: string
 * - prefix: string ("+595" | "+55" | "+54" | "+1" | "+other")
 * - onPrefixChange: (prefix: string) => void
 * - value: string (número local, sin prefijo)
 * - onChange: (e) => void  — igual que un input estándar
 * - error: string
 * - helperText: string
 * - required: boolean
 * - disabled: boolean
 */
export default function PhoneInput({
  label,
  prefix = "+595",
  onPrefixChange,
  value = "",
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className,
}) {
  const id = useId();
  const currentConfig = PHONE_PREFIXES.find((p) => p.code === prefix) ?? PHONE_PREFIXES[0];

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Text as="label" variant="label" htmlFor={id}>
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </Text>
      )}

      <div className={cn(
        "flex rounded-xl border overflow-hidden transition-all",
        error
          ? "border-red-300 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500"
          : "border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500",
        disabled && "opacity-50"
      )}>
        {/* Selector de prefijo */}
        <div className="relative shrink-0">
          <select
            value={prefix}
            onChange={(e) => onPrefixChange?.(e.target.value)}
            disabled={disabled}
            aria-label="Prefijo de país"
            className={cn(
              "h-full appearance-none pl-2.5 pr-6 py-2.5 text-sm font-semibold bg-slate-50",
              "border-r border-slate-200 text-slate-700 outline-none cursor-pointer",
              "hover:bg-slate-100 transition-colors"
            )}
          >
            {PHONE_PREFIXES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.flag} {p.code === "+other" ? "Otro" : p.code}
              </option>
            ))}
          </select>
          {/* Chevron */}
          <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Input de número */}
        <input
          id={id}
          type="tel"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={currentConfig.placeholder}
          className={cn(
            "flex-1 min-w-0 px-3 py-2.5 text-sm font-medium outline-none bg-slate-50",
            "focus:bg-white transition-colors",
            error ? "text-red-900 placeholder:text-red-300" : "text-slate-700 placeholder:text-slate-400"
          )}
        />
      </div>

      {(error || helperText) && (
        <Text
          variant="bodySm"
          className={cn("text-xs", error ? "text-red-500" : "text-slate-400")}
        >
          {error || helperText}
        </Text>
      )}
    </div>
  );
}
