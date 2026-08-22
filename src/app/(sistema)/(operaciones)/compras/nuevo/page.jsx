"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader, Button } from "@/components/ui";
import OrdenCompraForm from "@/components/compras/OrdenCompraForm";

export default function NuevaOrdenCompraPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Compras", href: "/compras" },
          { label: "Nueva Orden" },
        ]}
        subtitle="Registrar orden de compra / importación"
        subtitleClassName="text-blue-600"
      >
        <Link href="/compras">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>Volver</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-4xl mx-auto">
          <OrdenCompraForm
            onSuccess={(resultado) => router.push(`/compras/${resultado?.id || ""}`)}
            onCancel={() => router.push("/compras")}
          />
        </div>
      </main>
    </div>
  );
}
