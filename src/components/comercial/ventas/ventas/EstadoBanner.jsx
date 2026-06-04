"use client";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button, Text } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Banner de estado cerrado (ganada/perdida) de una oportunidad.
 */
export default function EstadoBanner({ etapa, motivoPerdida, onReabrir, saving }) {
  if (etapa !== "ganada" && etapa !== "perdida") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-4 rounded-xl border",
        etapa === "ganada"
          ? "bg-emerald-50 border-emerald-200"
          : "bg-red-50 border-red-200"
      )}
    >
      {etapa === "ganada" ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
      )}
      <div>
        <Text
          variant="bodySmBold"
          as="p"
          className={etapa === "ganada" ? "text-emerald-800" : "text-red-800"}
        >
          {etapa === "ganada" ? "Oportunidad ganada" : "Oportunidad perdida"}
        </Text>
        {etapa === "perdida" && motivoPerdida && (
          <Text variant="bodySm" as="p" className="text-red-600 mt-0.5">
            Motivo: {motivoPerdida}
          </Text>
        )}
      </div>
      {etapa === "perdida" && (
        <Button
          variant="secondary"
          size="xs"
          className="ml-auto"
          onClick={onReabrir}
          disabled={saving}
        >
          Reabrir
        </Button>
      )}
    </div>
  );
}
