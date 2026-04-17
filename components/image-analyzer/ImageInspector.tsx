import React, { useState, useRef, useCallback } from 'react';
import { ZoomInIcon, ZoomOutIcon, UndoIcon as ResetIcon } from '../Icons';

interface ImageInspectorProps {
    src: string;
    alt: string;
    className?: string;
}

const ImageInspector: React.FC<ImageInspectorProps> = ({ src, alt, className }) => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const lastPan = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 4));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoom <= 1) return;
        setIsPanning(true);
        startPos.current = { x: e.clientX - lastPan.current.x, y: e.clientY - lastPan.current.y };
    }, [zoom]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning) return;
        const newPan = { x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y };
        lastPan.current = newPan;
        setPan(newPan);
    }, [isPanning]);

    const handleMouseUp = useCallback(() => setIsPanning(false), []);

    const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); lastPan.current = { x: 0, y: 0 }; };

    return (
        <div
            className="relative w-full h-full overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
        >
            <img
                src={src}
                alt={alt}
                className={className}
                style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    transformOrigin: 'center',
                    transition: isPanning ? 'none' : 'transform 0.1s ease',
                    userSelect: 'none',
                    pointerEvents: 'none',
                }}
                draggable={false}
            />
            {zoom !== 1 && (
                <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                    <button onClick={() => setZoom(z => Math.min(z + 0.3, 4))} className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"><ZoomInIcon /></button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.3, 0.5))} className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"><ZoomOutIcon /></button>
                    <button onClick={reset} className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"><ResetIcon /></button>
                </div>
            )}
            {zoom === 1 && (
                <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => setZoom(1.5)} className="p-1 rounded bg-black/40 text-white text-[9px]"><ZoomInIcon /></button>
                </div>
            )}
        </div>
    );
};

export default ImageInspector;
