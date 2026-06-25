"use client";
import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, LoadingScreen } from "@/components/ui";
import { useToast } from "@/components/ui";
import { createPresupuesto } from "@/services/apis/ventas";

/**
 * Página legacy de creación de presupuesto.
 * Crea el borrador y redirige inmediatamente a /presupuestos/[id].
 * El flujo principal ya no pasa por acá (se crea directo desde la oportunidad),
 * pero se mantiene por si alguien tiene la URL guardada.
 */
export default function NuevoPresupuestoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const oportunidadId = searchParams.get("oportunidad");
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!oportunidadId || creatingRef.current) return;
    creatingRef.current = true;

    createPresupuesto({
      oportunidad: parseInt(oportunidadId, 10),
      moneda: "USD",
      notas: "",
      vigencia_dias: 3,
      lineas: [],
    })
      .then((presupuesto) => {
        router.replace(`/ventas-crm/presupuestos/${presupuesto.id}`);
      })
      .catch((err) => {
        showToast(err?.data?.detail || "Error al crear presupuesto", "error");
        router.replace(`/ventas-crm/oportunidades/${oportunidadId}`);
      });
  }, [oportunidadId, router, showToast]);

  if (!oportunidadId) {
    return (
      <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
        <PageHeader
          breadcrumbs={[
            { label: "Presupuestos", href: "/ventas-crm/presupuestos" },
            { label: "Nuevo" },
          ]}
        />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-700">
              No se encontró la oportunidad
            </h2>
            <p className="text-sm text-slate-500">
              Necesitás asociar este presupuesto a una oportunidad en negociación.
            </p>
            <Link
              href="/ventas-crm/oportunidades"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Ir a oportunidades
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return <LoadingScreen texto="Creando presupuesto..." />;
}
