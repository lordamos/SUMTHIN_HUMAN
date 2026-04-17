import React, { useRef } from 'react';
import { UploadIcon } from '../Icons';

interface Props {
    isDragActive: boolean;
    onDrag: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (files: FileList | null) => void;
}

const UploadZone: React.FC<Props> = ({ isDragActive, onDrag, onDrop, onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-2xl bg-black/20 border-2 border-dashed text-center transition-all cursor-pointer hover:border-teal-400/80 hover:bg-black/30 ${isDragActive ? 'border-teal-400/80 bg-black/30' : 'border-white/10'}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => onFileSelect(e.target.files)}
                multiple
            />
            <div className="flex flex-col items-center text-gray-400">
                <UploadIcon />
                <p className="mt-2 text-sm font-medium text-gray-300">
                    {isDragActive ? 'Drop images here...' : 'Drag & drop or click to upload images'}
                </p>
            </div>
        </div>
    );
};

export default UploadZone;
