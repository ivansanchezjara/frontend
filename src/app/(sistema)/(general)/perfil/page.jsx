"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  Mail,
  Save,
  Shield,
  User,
} from "lucide-react";

import { Badge, Button, Heading, Input, LoadingScreen, Text } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getProfile, updateProfile } from "@/services/apis/auth.js";

function getInitial(profile) {
  return (profile?.first_name?.[0] || profile?.username?.[0] || "?").toUpperCase();
}

function getGroupLabel(group) {
  if (typeof group === "string") return group;
  return group?.name || group?.label || "Grupo";
}

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [profile, setProfile] = useState(null);

  const { loading } = useApi(getProfile, {
    auto: true,
    initialData: null,
    onSuccess: (data) => setProfile(data),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const updated = await updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
      });
      setProfile(updated);
      
      // Dispatch standard event to sync user profile changes with the Sidebar Layout immediately
      window.dispatchEvent(new Event("user-updated"));
      
      setSuccessMsg("Perfil actualizado correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Cargando tu perfil..." />;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-4 md:p-10">
      <header className="space-y-2">
        <Heading level={1}>Mi Perfil</Heading>
        <Text>
          Gestiona tu información personal y verifica tus permisos de acceso.
        </Text>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <aside className="space-y-6 md:col-span-1">
          <section className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-3xl font-black text-white shadow-xl shadow-blue-100">
              {getInitial(profile)}
            </div>
            <Heading level={3} className="leading-tight">
              {profile?.first_name} {profile?.last_name}
            </Heading>
            <Text variant="caption" className="mt-2 text-slate-400">
              @{profile?.username}
            </Text>

            <div className="mt-8 w-full space-y-4 border-t border-slate-50 pt-8">
              <div className="flex flex-col items-center gap-2">
                <Text variant="label" className="text-slate-300">
                  Estado
                </Text>
                <Badge variant="success" className="px-4 py-1.5">
                  Activo
                </Badge>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-slate-900 p-8 text-white shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                <Shield size={18} />
              </div>
              <Text as="h2" variant="label" className="text-white">
                Grupos y Permisos
              </Text>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile?.groups?.length > 0 ? (
                profile.groups.map((group, idx) => (
                  <Badge
                    key={`${getGroupLabel(group)}-${idx}`}
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-white"
                  >
                    {getGroupLabel(group)}
                  </Badge>
                ))
              ) : (
                <Text variant="bodySm" className="text-xs italic text-white/40">
                  Sin grupos asignados
                </Text>
              )}
            </div>
          </section>
        </aside>

        <section className="md:col-span-2">
          <form
            onSubmit={handleSave}
            className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Nombre"
                type="text"
                name="first_name"
                value={profile?.first_name || ""}
                onChange={handleChange}
                icon={User}
                placeholder="Tu nombre..."
              />

              <Input
                label="Apellido"
                type="text"
                name="last_name"
                value={profile?.last_name || ""}
                onChange={handleChange}
                icon={User}
                placeholder="Tu apellido..."
              />

              <Input
                label="Correo Electrónico"
                type="email"
                name="email"
                value={profile?.email || ""}
                onChange={handleChange}
                icon={Mail}
                placeholder="tu@email.com"
                fullWidth
              />
            </div>

            {successMsg && (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-600 animate-in fade-in zoom-in-95">
                <Check size={20} />
                <Text variant="bodySm" className="font-black uppercase tracking-tight text-emerald-600">
                  {successMsg}
                </Text>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-600">
                <AlertCircle size={20} />
                <Text variant="bodySm" className="font-black uppercase tracking-tight text-red-600">
                  {errorMsg}
                </Text>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                disabled={saving}
                size="md"
                icon={saving ? Loader2 : Save}
                className={`w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 ${
                  saving ? "[&>svg]:animate-spin" : ""
                }`}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
