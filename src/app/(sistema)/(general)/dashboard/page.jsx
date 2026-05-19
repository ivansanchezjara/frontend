"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { Badge, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  familyStyles,
  modulosActivos,
  modulosFuturos,
  ordenFamilias,
} from "@/config/navigation";
import { getUser } from "@/services/apis/auth.js";

function userHasPermission(user, item) {
  if (!item.roles || item.roles.length === 0) return true;
  if (user?.is_superuser) return true;

  const userGroups = user?.groups || [];

  return item.roles.some((role) => {
    if (typeof userGroups[0] === "string") {
      return userGroups.includes(role);
    }

    if (typeof userGroups[0] === "object") {
      return userGroups.some((group) => group.name === role);
    }

    return false;
  });
}

function ModuleCard({ module, style }) {
  return (
    <Link href={module.href} className="group h-full">
      <article
        className={cn(
          "flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md",
          style.borderHover
        )}
      >
        <span
          className={cn(
            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-colors group-hover:text-white",
            style.bg,
            style.text,
            style.groupHoverBg
          )}
        >
          {module.icon}
        </span>
        <Heading level={5} className="text-sm uppercase">
          {module.title}
        </Heading>
        <Text variant="bodySm" className="mt-1 text-[11px]">
          {module.desc}
        </Text>
      </article>
    </Link>
  );
}

function FutureModuleCard({ module }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 opacity-60 grayscale">
      <span className="mb-4 text-2xl">{module.icon}</span>
      <Heading level={5} className="text-sm uppercase text-slate-700">
        {module.title}
      </Heading>
      <Text variant="bodySm" className="mt-1 text-[11px]">
        {module.desc}
      </Text>
      <Badge className="absolute right-4 top-4 rounded-md bg-slate-200 px-2 py-1 text-[9px] text-slate-500">
        Pronto
      </Badge>
    </article>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  const nombreUsuario = user
    ? user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.username || "Usuario"
    : "Usuario";

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
        <header className="animate-in fade-in duration-500">
          <Heading level={2}>
            Bienvenido, <span className="text-blue-600">Usuario</span>
          </Heading>
          <Text className="mt-1">Panel de control del sistema.</Text>
        </header>

        <div className="space-y-12">
          {[1, 2].map((sectionId) => (
            <section key={sectionId} className="space-y-6">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((cardId) => (
                  <div
                    key={cardId}
                    className="flex h-[180px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse"
                  >
                    <div className="mb-4 h-12 w-12 rounded-xl bg-slate-200" />
                    <div className="h-4 w-28 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <header className="animate-in fade-in slide-in-from-left-4 duration-700">
        <Heading level={2}>
          Bienvenido, <span className="text-blue-600">{nombreUsuario}</span>
        </Heading>
        <Text className="mt-1">Panel de control del sistema.</Text>
      </header>

      <div className="space-y-12">
        {ordenFamilias.map((colorKey) => {
          const style = familyStyles[colorKey];
          const activos = modulosActivos.filter(
            (module) =>
              module.color === colorKey && userHasPermission(user, module),
          );
          const futuros = modulosFuturos.filter(
            (module) =>
              module.color === colorKey && userHasPermission(user, module),
          );

          if (activos.length === 0 && futuros.length === 0) return null;

          return (
            <section key={colorKey} className="space-y-6">
              <div className="flex items-center gap-3">
                <Text
                  as="h3"
                  variant="caption"
                  className={cn(style.text, "whitespace-nowrap")}
                >
                  {style.label}
                </Text>
                <span className={cn("h-px flex-1", style.line)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activos.map((module) => (
                  <ModuleCard
                    key={module.href}
                    module={module}
                    style={style}
                  />
                ))}

                {futuros.map((module) => (
                  <FutureModuleCard key={module.title} module={module} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
