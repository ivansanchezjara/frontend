"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { getFullImageUrl } from '@/services/api';
import { Package, Calendar, MapPin, User, FileText, ChevronLeft, Printer, CheckCircle2, Clock, Tag, Settings2, Check, Inbox, Download } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Usamos lucide-react para los iconos
import { 
    Package as PackageIcon, 
    Calendar as CalendarIcon, 
    MapPin as MapPinIcon, 
    User as UserIcon, 
    FileText as FileTextIcon, 
    ChevronLeft as ChevronLeftIcon, 
    Printer as PrinterIcon, 
    CheckCircle2 as CheckCircle2Icon, 
    Clock as ClockIcon, 
    Tag as TagIcon, 
    Settings2 as Settings2Icon, 
    Check as CheckIcon, 
    Inbox as InboxIcon, 
    Download as DownloadIcon 
} from 'lucide-react';

const COLUMNAS_CONFIG = [
    { id: 'foto', label: 'Fotos' },
    { id: 'lote', label: 'Nº de Lote' },
    { id: 'vencimiento', label: 'F. Vencimiento' },
    { id: 'costos', label: 'Costos (FOB/Landed)' },
    { id: 'p0', label: 'P. Público (P0)' },
    { id: 'p_otros', label: 'P. Distribución (P1-P4)' },
];

export default function DetalleIngresoPage() {
    const { id } = useParams();
    const router = useRouter();
    const [ingreso, setIngreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [colsVisibles, setColsVisibles] = useState(['foto', 'lote', 'vencimiento', 'costos', 'p0', 'p_otros']);
    const [showConfig, setShowConfig] = useState(false);

    const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        return 'http://127.0.0.1:8000';
    };

    useEffect(() => {
        const token = Cookies.get('token');
        const API_BASE = getApiUrl();
        async function fetchDetalle() {
            try {
                const res = await fetch(`${API_BASE}/api/inventario/ingresos/${id}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setIngreso(await res.json());
                else router.push('/movimientos/ingresos');
            } catch (err) { console.error(err); } finally { setLoading(false); }
        }
        fetchDetalle();
    }, [id]);

    const toggleCol = (id) => {
        setColsVisibles(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const handleExportExcel = () => {
        if (!ingreso) return;
        
        let headers = ["Codigo", "Producto", "Cantidad"];
        if (colsVisibles.includes('lote')) headers.push("Lote");
        if (colsVisibles.includes('vencimiento')) headers.push("Vencimiento");
        if (colsVisibles.includes('costos')) headers.push("Costo FOB", "Costo Landed");
        if (colsVisibles.includes('p0')) headers.push("Precio P0");
        if (colsVisibles.includes('p_otros')) headers.push("P1", "P2", "P3", "P4");

        const rows = ingreso.items.map(it => {
            let row = [it.variante_codigo, it.variante_nombre, it.cantidad];
            if (colsVisibles.includes('lote')) row.push(it.lote_codigo || 'N/A');
            if (colsVisibles.includes('vencimiento')) row.push(it.vencimiento || 'N/A');
            if (colsVisibles.includes('costos')) row.push(it.costo_fob_unitario, it.costo_landed_unitario);
            if (colsVisibles.includes('p0')) row.push(it.nuevo_precio_0_publico);
            if (colsVisibles.includes('p_otros')) row.push(it.nuevo_precio_1_estudiante, it.nuevo_precio_2_reventa, it.nuevo_precio_3_mayorista, it.nuevo_precio_4_intercompany);
            return row;
        });

        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Ingreso_${ingreso.id}.csv`);
        link.click();
    };

    if (loading) return <LoadingScreen message="Cargando auditoría..." />;
    if (!ingreso) return null;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

    return (
        <div className="p-4 md:p-10 max-w-[1800px] mx-auto space-y-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-8 no-print">
                <div>
                    <Link href="/movimientos/ingresos" className="flex items-center gap-1 text-xs font-black text-emerald-600 uppercase tracking-widest hover:translate-x-1 transition-all mb-4">
                        <ChevronLeftIcon size={16} /> Volver al Listado
                    </Link>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Comprobante #{ingreso.id}</h1>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${ingreso.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {ingreso.estado}
                        </span>
                    </div>
                </div>

                <div className="flex gap-3 relative">
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm border ${showConfig ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Settings2Icon size={16} /> Configurar Vista
                    </button>

                    {showConfig && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[50] p-4 flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Columnas Visibles</p>
                            {COLUMNAS_CONFIG.map(col => (
                                <button key={col.id} onClick={() => toggleCol(col.id)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition-all">
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${colsVisibles.includes(col.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}><CheckIcon size={14} strokeWidth={4} /></div>
                                    <span className="text-xs font-bold text-slate-700">{col.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3">
                        <DownloadIcon size={18} /> Descargar Excel
                    </button>
                    
                    {ingreso.estado === 'BORRADOR' && (
                        <Link href={`/movimientos/ingresos/${id}`} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                            Editar
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[85vh]">
                    <table className="w-full text-left border-separate border-spacing-0 table-auto">
                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-5 border-b border-slate-100">Producto</th>
                                <th className="px-4 py-5 text-center border-b border-slate-100">Cant.</th>
                                {colsVisibles.includes('lote') && <th className="px-6 py-5 border-b border-slate-100">Nº Lote</th>}
                                {colsVisibles.includes('vencimiento') && <th className="px-6 py-5 border-b border-slate-100 whitespace-nowrap">Vencimiento</th>}
                                {colsVisibles.includes('costos') && (
                                    <>
                                        <th className="px-6 py-5 text-right border-b border-slate-100">Costo FOB</th>
                                        <th className="px-6 py-5 text-right border-b border-slate-100">Costo Landed</th>
                                    </>
                                )}
                                {colsVisibles.includes('p0') && <th className="px-6 py-5 text-center bg-blue-50/20 text-blue-600 border-b border-blue-100 border-x border-white">Precio P0</th>}
                                {colsVisibles.includes('p_otros') && (
                                    <>
                                        <th className="px-4 py-5 text-center bg-blue-50/20 text-blue-500 border-b border-blue-100">P1</th>
                                        <th className="px-4 py-5 text-center bg-blue-50/10 text-blue-500 border-b border-blue-100">P2</th>
                                        <th className="px-4 py-5 text-center bg-blue-50/20 text-blue-500 border-b border-blue-100">P3</th>
                                        <th className="px-4 py-5 text-center bg-blue-50/10 text-blue-500 border-b border-blue-100">P4</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {ingreso.items?.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {colsVisibles.includes('foto') && (
                                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl overflow-hidden p-1 shadow-sm shrink-0 no-print">
                                                    <img src={getFullImageUrl(item.variante_imagen_url)} alt="x" className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-black text-slate-800 leading-tight truncate">{item.variante_nombre}</div>
                                                <div className="text-[9px] font-bold text-slate-400 mt-0.5">{item.variante_codigo}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center"><span className="inline-flex min-w-[32px] px-2 h-8 items-center justify-center bg-slate-900 text-white rounded-lg text-xs font-black">{item.cantidad}</span></td>
                                    {colsVisibles.includes('lote') && <td className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase whitespace-nowrap"><InboxIcon size={12} className="inline mr-1 text-slate-300"/> {item.lote_codigo || 'S/L'}</td>}
                                    {colsVisibles.includes('vencimiento') && (
                                        <td className="px-6 py-4">
                                            {item.vencimiento ? (
                                                <div className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-1.5 whitespace-nowrap bg-amber-50 px-2 py-1 rounded-lg">
                                                    <ClockIcon size={12}/> {new Date(item.vencimiento).toLocaleDateString()}
                                                </div>
                                            ) : <span className="text-[9px] font-bold text-slate-300 italic uppercase">Sin Venc.</span>}
                                        </td>
                                    )}
                                    {colsVisibles.includes('costos') && (
                                        <>
                                            <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-500">{formatCurrency(item.costo_fob_unitario)}</td>
                                            <td className="px-6 py-4 text-right text-[10px] font-black text-slate-900">{formatCurrency(item.costo_landed_unitario)}</td>
                                        </>
                                    )}
                                    {colsVisibles.includes('p0') && <td className="px-6 py-4 text-center bg-blue-50/10 font-black text-[11px] text-blue-700 border-x border-white">{formatCurrency(item.nuevo_precio_0_publico)}</td>}
                                    {colsVisibles.includes('p_otros') && (
                                        <>
                                            <td className="px-4 py-4 text-center bg-blue-50/5 text-[10px] font-bold text-blue-500">{formatCurrency(item.nuevo_precio_1_estudiante)}</td>
                                            <td className="px-4 py-4 text-center bg-blue-50/5 text-[10px] font-bold text-blue-500">{formatCurrency(item.nuevo_precio_2_reventa)}</td>
                                            <td className="px-4 py-4 text-center bg-blue-50/5 text-[10px] font-bold text-blue-500">{formatCurrency(item.nuevo_precio_3_mayorista)}</td>
                                            <td className="px-4 py-4 text-center bg-blue-50/5 text-[10px] font-bold text-blue-500">{formatCurrency(item.nuevo_precio_4_intercompany)}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center no-print">
                    <div className="flex items-center gap-3">
                        <CheckCircle2Icon size={24} className="text-emerald-400" />
                        <span className="text-sm font-medium italic text-slate-300">"{ingreso.descripcion || 'Sin observaciones'}"</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Costo Total Arribo (Landed)</p>
                        <p className="text-4xl font-black text-emerald-400">{formatCurrency(ingreso.items?.reduce((s,i)=>s+(i.cantidad*i.costo_landed_unitario),0))}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
