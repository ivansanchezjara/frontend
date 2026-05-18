"use client";

import Link from "next/link";

import { Heading, Text } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
      <div className="mb-8">
        <div className="mb-6 inline-block rounded-3xl bg-slate-900 p-4 text-white shadow-2xl shadow-blue-500/20">
          <span className="text-5xl font-black">404</span>
        </div>
        <Heading level={1} className="mb-3">
          Página no encontrada
        </Heading>
        <Text className="mx-auto max-w-sm">
          Lo sentimos, la ruta que buscas no existe o fue movida a otra sección
          del sistema.
        </Text>
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
        >
          VOLVER AL PANEL
        </Link>
      </div>

      <Text variant="caption" className="mt-16">
        ERP.CORE Security System
      </Text>
    </div>
  );
}
