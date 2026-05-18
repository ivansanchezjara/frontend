"use client";
import { useState, useRef } from 'react';
import { Badge } from '@/components/ui';
import { X } from 'lucide-react';

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
            className="min-h-[44px] w-full flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all cursor-text"
        >
            {tags.map(tag => (
                <Badge
                    key={tag}
                    variant="primary"
                    className="gap-1 normal-case tracking-normal py-1"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                        className="text-blue-400 hover:text-blue-700 transition-colors ml-0.5 flex items-center"
                    >
                        <X size={12} />
                    </button>
                </Badge>
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
