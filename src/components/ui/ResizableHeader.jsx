// src/components/ui/ResizableHeader.jsx
import { useState, useRef, useEffect } from 'react';

export default function ResizableHeader({ children, defaultWidth = 150, minWidth = 50, className = "" }) {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);

    const startX = useRef(0);
    const startWidth = useRef(0);

    const startResize = (clientX) => {
        setIsResizing(true);
        startX.current = clientX;
        startWidth.current = width;
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        startResize(e.pageX);
    };

    const handleTouchStart = (e) => startResize(e.touches[0].pageX);
    const handleDoubleClick = () => setWidth(defaultWidth);

    useEffect(() => {
        const handleMove = (clientX) => {
            if (!isResizing) return;
            const newWidth = startWidth.current + (clientX - startX.current);
            setWidth(Math.max(minWidth, newWidth));
        };

        const handleMouseMove = (e) => handleMove(e.pageX);
        const handleTouchMove = (e) => handleMove(e.touches[0].pageX);
        const handleUp = () => setIsResizing(false);

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleUp);

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, minWidth]);

    return (
        <th
            style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
            className={`relative group/header align-middle ${className} ${isResizing ? 'bg-slate-100/50' : 'transition-colors'}`}
        >
            <div className="w-full h-full flex flex-col justify-center truncate pr-4 relative z-0">
                <span className="truncate w-full inline-block text-left">
                    {children}
                </span>
            </div>
            <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onDoubleClick={handleDoubleClick}
                className="absolute right-0 top-0 bottom-0 w-5 cursor-col-resize flex justify-center items-center z-20 group/handle touch-none"
            >
                <div
                    className={`transition-all duration-200 ease-out rounded-full
                        ${isResizing
                            ? 'h-full bg-blue-500 w-[2px]'
                            : 'h-1/2 w-[1px] bg-slate-300 group-hover/handle:w-[3px] group-hover/handle:bg-slate-400 group-hover/handle:h-6'
                        }`}
                />

                {isResizing && (
                    <div className="absolute top-full right-[10px] w-[2px] h-[2000px] bg-blue-500/30 pointer-events-none z-50" />
                )}
            </div>
        </th>
    );
}