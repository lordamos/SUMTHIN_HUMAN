import React from 'react';
import type { DominantColorsResult } from '../../types';
import { ClipboardIcon, CheckIcon } from '../Icons';

interface Props {
    result: DominantColorsResult;
}

const ColorPaletteView: React.FC<Props> = ({ result }) => {
    const [copiedHex, setCopiedHex] = React.useState<string | null>(null);

    const copyHex = (hex: string) => {
        navigator.clipboard.writeText(hex).then(() => {
            setCopiedHex(hex);
            setTimeout(() => setCopiedHex(null), 2000);
        });
    };

    return (
        <div className="space-y-3">
            <h3 className="text-base font-semibold text-blue-300">🎨 Dominant Colors</h3>
            <div className="flex gap-2 flex-wrap">
                {result.colors.map((c, i) => (
                    <button
                        key={i}
                        onClick={() => copyHex(c.hex)}
                        className="flex flex-col items-center gap-1.5 group"
                        title={`Copy ${c.hex}`}
                    >
                        <div
                            className="w-12 h-12 rounded-xl border-2 border-white/10 group-hover:border-white/30 transition-colors shadow-lg flex items-center justify-center"
                            style={{ backgroundColor: c.hex }}
                        >
                            {copiedHex === c.hex && (
                                <CheckIcon className="text-white drop-shadow" />
                            )}
                        </div>
                        <span className="text-[9px] text-gray-400 font-mono">{c.hex}</span>
                        <span className="text-[8px] text-gray-600">{c.percentage}%</span>
                    </button>
                ))}
            </div>
            {result.mood && (
                <p className="text-xs text-gray-400 italic">Mood: {result.mood}</p>
            )}
        </div>
    );
};

export default ColorPaletteView;
