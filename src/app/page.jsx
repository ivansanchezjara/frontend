import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <h1 className="text-4xl font-black text-slate-900 mb-4">
        ERP<span className="text-blue-600">.</span>SYSTEM
      </h1>
      <p className="text-slate-500 mb-8 text-center max-w-sm">
        Bienvenido a la plataforma de gestión integral. Por favor, inicia sesión
        para acceder a los módulos.
      </p>
      <Link
        href="/login"
        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg"
      >
        Ir al Login
      </Link>
    </div>
  );
}
