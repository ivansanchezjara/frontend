import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ count, pageSize, currentPage, onPageChange }) {
    const totalPages = Math.ceil(count / pageSize);
    
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 py-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all shadow-sm active:scale-90"
            >
                <ChevronLeft size={18} />
            </button>

            {getPages()[0] > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${currentPage === 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-emerald-200'}`}
                    >
                        1
                    </button>
                    {getPages()[0] > 2 && <span className="text-slate-300 text-xs px-1">...</span>}
                </>
            )}

            {getPages().map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${currentPage === page ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-slate-50'}`}
                >
                    {page}
                </button>
            ))}

            {getPages()[getPages().length - 1] < totalPages && (
                <>
                    {getPages()[getPages().length - 1] < totalPages - 1 && <span className="text-slate-300 text-xs px-1">...</span>}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${currentPage === totalPages ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-emerald-200'}`}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all shadow-sm active:scale-90"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}
