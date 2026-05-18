"use client";

import { useState } from "react";
import { LockKeyhole, LogIn, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { BrandMark, Button, Heading, Input, Text } from "@/components/ui";
import { login } from "@/services/apis/auth.js";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al intentar ingresar.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandMark
            showIcon={false}
            size="lg"
            tone="light"
            className="mb-4 rounded-lg bg-slate-900 px-4 py-3 shadow-lg shadow-blue-200"
          />
          <Heading level={1}>
            Acceso al sistema
          </Heading>
          <Text variant="caption" className="mt-2">
            Gestión integral
          </Text>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <Input
              label="Usuario"
              type="text"
              placeholder="Ingresar usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={User}
              autoComplete="username"
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={LockKeyhole}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              icon={LogIn}
              className="w-full"
              size="lg"
            >
              {loading ? "Autenticando..." : "Ingresar al panel"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
