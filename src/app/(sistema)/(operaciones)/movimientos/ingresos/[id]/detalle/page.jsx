"use client";
import { LoadingScreen, PageHeader, ResizableHeader } from '@/components/ui';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getFullImageUrl } from '@/services/apis/catalogo';
import {
    Package, CheckCircle2 as CheckCircle2Icon,
    Clock as ClockIcon,
    Settings2 as Settings2Icon,
    Check as CheckIcon,
    Inbox as InboxIcon,
    Download as DownloadIcon
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { getIngreso } from '@/services/apis/movimientos';

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

    const { data: ingreso, loading } = useApi(() => getIngreso(id), {
        auto: true,
        onError: () => router.push('/movimientos/ingresos')
    });

    const [colsVisibles, setColsVisibles] = useState(['foto', 'lote', 'vencimiento', 'costos', 'p0', 'p_otros']);
    const [showConfig, setShowConfig] = useState(false);

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
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Ingresos de Mercadería', href: '/movimientos/ingresos' },
                    { label: `Comprobante #${ingreso.id}` }
                ]}
                subtitle={
                    <>
                        <Package size={12} />
                        <span>Detalle de Ingreso</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${ingreso.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {ingreso.estado}
                        </span>
                    </>
                }
                subtitleClassName="text-blue-600"
            >
                <div className="flex items-center gap-3 relative no-print">
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm border ${showConfig ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Settings2Icon size={14} /> Vista
                    </button>

                    {showConfig && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[50] p-3 flex flex-col gap-0.5 animate-in slide-in-from-top-2 duration-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Columnas</p>
                            {COLUMNAS_CONFIG.map(col => (
                                <button key={col.id} onClick={() => toggleCol(col.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left transition-all">
                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${colsVisibles.includes(col.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}><CheckIcon size={12} strokeWidth={4} /></div>
                                    <span className="text-[10px] font-bold text-slate-700">{col.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">
                        <DownloadIcon size={14} /> Excel
                    </button>

                    {ingreso.estado === 'BORRADOR' && (
                        <Link href={`/movimientos/ingresos/${id}`} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
                            Editar
                        </Link>
                    )}
                </div>
            </PageHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto max-h-[85vh]">
                            <table className="w-full text-left border-separate border-spacing-0 table-auto">
                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <ResizableHeader defaultWidth={300} minWidth={200} className="px-6 py-5 border-b border-slate-100">Producto</ResizableHeader>
                                        <ResizableHeader defaultWidth={100} minWidth={80} className="px-4 py-5 text-center border-b border-slate-100">Cant.</ResizableHeader>
                                        {colsVisibles.includes('lote') && <ResizableHeader defaultWidth={120} minWidth={100} className="px-6 py-5 border-b border-slate-100">Nº Lote</ResizableHeader>}
                                        {colsVisibles.includes('vencimiento') && <ResizableHeader defaultWidth={140} minWidth={100} className="px-6 py-5 border-b border-slate-100 whitespace-nowrap">Vencimiento</ResizableHeader>}
                                        {colsVisibles.includes('costos') && (
                                            <>
                                                <ResizableHeader defaultWidth={120} minWidth={100} className="px-6 py-5 text-right border-b border-slate-100">Costo FOB</ResizableHeader>
                                                <ResizableHeader defaultWidth={140} minWidth={100} className="px-6 py-5 text-right border-b border-slate-100">Costo Landed</ResizableHeader>
                                            </>
                                        )}
                                        {colsVisibles.includes('p0') && <ResizableHeader defaultWidth={120} minWidth={100} className="px-6 py-5 text-center bg-blue-50/20 text-blue-600 border-b border-blue-100 border-x border-white">Precio P0</ResizableHeader>}
                                        {colsVisibles.includes('p_otros') && (
                                            <>
                                                <ResizableHeader defaultWidth={90} minWidth={70} className="px-4 py-5 text-center bg-blue-50/20 text-blue-500 border-b border-blue-100">P1</ResizableHeader>
                                                <ResizableHeader defaultWidth={90} minWidth={70} className="px-4 py-5 text-center bg-blue-50/10 text-blue-500 border-b border-blue-100">P2</ResizableHeader>
                                                <ResizableHeader defaultWidth={90} minWidth={70} className="px-4 py-5 text-center bg-blue-50/20 text-blue-500 border-b border-blue-100">P3</ResizableHeader>
                                                <ResizableHeader defaultWidth={90} minWidth={70} className="px-4 py-5 text-center bg-blue-50/10 text-blue-500 border-b border-blue-100">P4</ResizableHeader>
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
                                            {colsVisibles.includes('lote') && <td className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase whitespace-nowrap"><InboxIcon size={12} className="inline mr-1 text-slate-300" /> {item.lote_codigo || 'S/L'}</td>}
                                            {colsVisibles.includes('vencimiento') && (
                                                <td className="px-6 py-4">
                                                    {item.vencimiento ? (
                                                        <div className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-1.5 whitespace-nowrap bg-amber-50 px-2 py-1 rounded-lg">
                                                            <ClockIcon size={12} /> {new Date(item.vencimiento).toLocaleDateString()}
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

                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center no-print rounded-b-[40px]">
                            <div className="flex items-center gap-3">
                                <CheckCircle2Icon size={24} className="text-emerald-400" />
                                <span className="text-sm font-medium italic text-slate-300">"{ingreso.descripcion || 'Sin observaciones'}"</span>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* TOTAL FOB */}
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total FOB</p>
                                    <p className="text-xl font-black text-slate-300">
                                        {formatCurrency(ingreso.items?.reduce((s, i) => s + (i.cantidad * (i.costo_fob_unitario || 0)), 0))}
                                    </p>
                                </div>

                                {/* SEPARADOR VERTICAL */}
                                <div className="w-px h-8 bg-slate-700"></div>

                                {/* TOTAL LANDED */}
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Costo Total Arribo (Landed)</p>
                                    <p className="text-2xl font-black text-emerald-400">
                                        {formatCurrency(ingreso.items?.reduce((s, i) => s + (i.cantidad * (i.costo_landed_unitario || 0)), 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
