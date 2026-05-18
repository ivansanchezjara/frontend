"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button, Heading, Text } from "@/components/ui";

export default function Error({ error, reset }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="mb-8">
        <div className="mb-6 inline-flex rounded-3xl bg-slate-900 p-4 text-white shadow-2xl shadow-blue-500/20">
          <TriangleAlert size={48} strokeWidth={2.5} />
        </div>
        <Heading level={1} className="mb-3">
          Algo salió mal
        </Heading>
        <Text className="mx-auto max-w-sm">
          {error?.message || "Ocurrió un error inesperado en el sistema."}
        </Text>
      </div>

      <Button onClick={() => reset()} icon={RotateCcw} size="lg">
        Intentar de nuevo
      </Button>

      <Text variant="caption" className="mt-16">
        ERP.CORE Security System
      </Text>
    </main>
  );
}
