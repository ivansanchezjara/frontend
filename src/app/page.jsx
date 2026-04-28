"use client";
import { useState } from 'react';
import { login } from '@/services/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      // AQUÍ ESTÁ LA MAGIA: Ahora usamos el mensaje exacto que tiró auth.jsx
      setError(err.message || 'Ocurrió un error inesperado al intentar ingresar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="max-w-[440px] w-full">
        {/* Logo / Marca */}
        <div className="text-center mb-10">
          <div className="inline-block bg-slate-900 text-white p-3 rounded-2xl mb-4 shadow-xl shadow-blue-500/20">
            <span className="text-2xl font-black tracking-tighter">
              ERP<span className="text-blue-500">.</span>CORE
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Acceso al Sistema</h1>
          <p className="text-slate-500 mt-2 font-medium text-sm uppercase tracking-widest">
            Gestión Integral
          </p>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Usuario
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 p-4 rounded-2xl border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-slate-900"
                placeholder="Ej: juan_fleitas"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full bg-slate-50 p-4 rounded-2xl border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-slate-900"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'AUTENTICANDO...' : 'INGRESAR AL PANEL'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}