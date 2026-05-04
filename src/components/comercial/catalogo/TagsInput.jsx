"use client";
import { useState, useRef } from 'react';

export default function TagsInput({ tags = [], onChange }) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    const addTag = () => {
        const tag = inputValue.trim().toLowerCase();
        if (tag && !tags.includes(tag)) {
            onChange([...tags, tag]);
        }
        setInputValue('');
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div
            onClick={() => inputRef.current?.focus()}
            className="min-h-[44px] w-full flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all cursor-text"
        >
            {tags.map(tag => (
                <span
                    key={tag}
                    className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                        className="text-blue-400 hover:text-blue-700 transition-colors ml-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                    </button>
                </span>
            ))}

            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? 'Escribí un tag y presioná Enter...' : ''}
                className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 font-medium"
            />
        </div>
    );
}
