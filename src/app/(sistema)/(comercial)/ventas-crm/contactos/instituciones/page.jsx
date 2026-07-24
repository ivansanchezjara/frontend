"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect: /ventas-crm/contactos/instituciones → /ventas-crm/instituciones
 * La pagina de instituciones ya existe como pagina standalone con CRUD completo.
 */
export default function InstitucionesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ventas-crm/instituciones");
  }, [router]);

  return null;
}
