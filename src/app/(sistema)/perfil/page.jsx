"use client";
import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '@/services/auth';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { User, Mail, Shield, Check, Save, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        async function loadProfile() {
            try {
                const data = await getProfile();
                setProfile(data);
            } catch (err) {
                console.error(err);
                setErrorMsg("No se pudo cargar la información del perfil.");
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            const updated = await updateProfile({
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email
            });
            setProfile(updated);
            setSuccessMsg("¡Perfil actualizado correctamente!");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg("Error al guardar los cambios.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingScreen message="Cargando tu perfil..." />;

    return (
        <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mi Perfil</h1>
                <p className="text-slate-500 font-medium">Gestiona tu información personal y verifica tus permisos de acceso.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Columna Izquierda: Resumen / Avatar */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 border-4 border-white mb-4">
                            {(profile?.first_name?.[0] || profile?.username?.[0] || '?').toUpperCase()}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 leading-tight">
                            {profile?.first_name} {profile?.last_name}
                        </h2>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">@{profile?.username}</p>
                        
                        <div className="mt-8 w-full border-t border-slate-50 pt-8 space-y-4">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Estado</span>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Activo</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"><Shield size={18} /></div>
                            <h3 className="text-xs font-black uppercase tracking-widest">Grupos y Permisos</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile?.groups?.length > 0 ? (
                                profile.groups.map((group, idx) => (
                                    <span key={idx} className="bg-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest">
                                        {group}
                                    </span>
                                ))
                            ) : (
                                <span className="text-white/40 text-[10px] italic">Sin grupos asignados</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSave} className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        type="text" 
                                        name="first_name"
                                        value={profile?.first_name || ''} 
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Tu nombre..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        type="text" 
                                        name="last_name"
                                        value={profile?.last_name || ''} 
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Tu apellido..."
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={profile?.email || ''} 
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {successMsg && (
                            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                                <Check size={20} />
                                <p className="text-sm font-black uppercase tracking-tight">{successMsg}</p>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3">
                                <AlertCircle size={20} />
                                <p className="text-sm font-black uppercase tracking-tight">{errorMsg}</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
