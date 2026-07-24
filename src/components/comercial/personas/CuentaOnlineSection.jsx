"use client";
import { useState } from "react";
import { Globe, ShieldCheck, ShieldX } from "lucide-react";

import { Button, Section } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";

/**
 * Sección para habilitar/deshabilitar la cuenta e-commerce de una persona.
 * Solo visible si la persona es cliente activo.
 */
export function CuentaOnlineSection({ persona, onHabilitar, onDeshabilitar }) {
  const { showToast } = useToast();
  const { danger, confirm } = useConfirm();
  const [loading, setLoading] = useState(false);

  const habilitada = persona.cuenta_online_habilitada;
  const esProspecto = persona.etapa === "prospecto";

  if (esProspecto) {
    return (
      <Section title="Cuenta E-commerce" subtitle="Portal de compras online.">
        <div className="p-6 text-center py-8">
          <Globe size={32} className="text-slate-300 mx-auto mb-2" />
          <Text variant="bodySm" className="text-slate-400">
            Solo disponible para clientes activos.
          </Text>
          <Text variant="mutedXs" className="text-slate-400 mt-1">
            Cambiá la etapa a "Activo" para habilitar la cuenta online.
          </Text>
        </div>
      </Section>
    );
  }

  const handleHabilitar = async () => {
    const ok = await confirm(
      `¿Habilitar cuenta e-commerce para "${persona.razon_social}"? Se creará un usuario con acceso al portal de compras.`,
      "Habilitar Cuenta Online",
      { confirmText: "Habilitar" }
    );
    if (!ok) return;
    setLoading(true);
    try {
      await onHabilitar();
      showToast("Cuenta e-commerce habilitada", "success");
    } catch (err) {
      showToast(err?.data?.detail || "Error al habilitar", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeshabilitar = async () => {
    const ok = await danger(
      `¿Deshabilitar cuenta e-commerce? El usuario no podrá acceder al portal de compras.`,
      "Deshabilitar Cuenta Online",
      { confirmText: "Deshabilitar" }
    );
    if (!ok) return;
    setLoading(true);
    try {
      await onDeshabilitar();
      showToast("Cuenta e-commerce deshabilitada", "info");
    } catch (err) {
      showToast(err?.data?.detail || "Error al deshabilitar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Cuenta E-commerce" subtitle="Portal de compras online.">
      <div className="p-6">
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-xl border",
          habilitada
            ? "bg-emerald-50/50 border-emerald-200"
            : "bg-slate-50 border-slate-200"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            habilitada ? "bg-emerald-100" : "bg-slate-100"
          )}>
            {habilitada
              ? <ShieldCheck size={20} className="text-emerald-600" />
              : <ShieldX size={20} className="text-slate-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <Text variant="bodySmBold" className={habilitada ? "text-emerald-700" : "text-slate-600"}>
              {habilitada ? "Cuenta habilitada" : "Sin cuenta online"}
            </Text>
            <Text variant="mutedXs" className="text-slate-400 mt-0.5">
              {habilitada
                ? "El cliente puede acceder al portal de compras con sus credenciales."
                : "Habilitá la cuenta para permitir compras desde el portal online."}
            </Text>
          </div>
          {habilitada ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeshabilitar}
              disabled={loading}
            >
              Deshabilitar
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleHabilitar}
              disabled={loading}
            >
              {loading ? "Habilitando..." : "Habilitar"}
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}
