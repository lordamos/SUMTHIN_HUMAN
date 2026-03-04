
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Fixed: Removed non-existent SpinnerIcon and SearchIcon from imports
import { GoogleDriveIcon, DropboxIcon, CheckIcon } from './Icons';
import type { CloudProvider, CloudFile } from '../types';

interface CloudPickerProps {
    onSelect: (file: CloudFile, provider: CloudProvider) => void;
    onClose: () => void;
    allowedMimeTypes?: string[];
}

const CloudPicker: React.FC<CloudPickerProps> = ({ onSelect, onClose, allowedMimeTypes }) => {
    const [activeProvider, setActiveProvider] = useState<CloudProvider>('google-drive');
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<CloudFile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock implementation of cloud connection
    const handleConnect = async (provider: CloudProvider) => {
        setIsLoading(true);
        setActiveProvider(provider);
        
        // Simulating API call
        setTimeout(() => {
            const mockFiles: CloudFile[] = [
                { id: '1', name: 'Thesis_Final_Draft.txt', type: 'text/plain', size: 1024 * 5 },
                { id: '2', name: 'AI_Generated_Portrait.jpg', type: 'image/jpeg', size: 1024 * 250 },
                { id: '3', name: 'Research_Notes.txt', type: 'text/plain', size: 1024 * 2 },
                { id: '4', name: 'Profile_Picture.png', type: 'image/png', size: 1024 * 500 },
                { id: '5', name: 'Article_Submission.txt', type: 'text/plain', size: 1024 * 12 }
            ];

            const filteredFiles = allowedMimeTypes 
                ? mockFiles.filter(f => allowedMimeTypes.some(type => f.type.includes(type.replace('*', ''))))
                : mockFiles;

            setFiles(filteredFiles);
            setIsLoading(false);
        }, 1200);
    };

    const handleFileClick = (file: CloudFile) => {
        // In a real app, this would fetch the actual file content/blob
        onSelect(file, activeProvider);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-gray-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Import from Cloud
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Select a file from your connected accounts</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="flex flex-1 min-h-0">
                    {/* Sidebar */}
                    <div className="w-20 sm:w-48 bg-black/20 border-r border-white/10 p-3 flex flex-col gap-2">
                        <ProviderTab 
                            id="google-drive" 
                            label="Google Drive" 
                            icon={<GoogleDriveIcon />} 
                            isActive={activeProvider === 'google-drive'} 
                            onClick={() => handleConnect('google-drive')} 
                        />
                        <ProviderTab 
                            id="dropbox" 
                            label="Dropbox" 
                            icon={<DropboxIcon className="text-blue-500" />} 
                            isActive={activeProvider === 'dropbox'} 
                            onClick={() => handleConnect('dropbox')} 
                        />
                    </div>

                    {/* File List */}
                    <div className="flex-1 flex flex-col bg-gray-900">
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search files..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-teal-400 outline-none transition-all"
                                />
                                <div className="absolute left-3 top-2.5 text-gray-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-sm font-medium">Connecting to {activeProvider === 'google-drive' ? 'Google Drive' : 'Dropbox'}...</p>
                                </div>
                            ) : files.length > 0 ? (
                                <div className="grid gap-2">
                                    {files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(file => (
                                        <button
                                            key={file.id}
                                            onClick={() => handleFileClick(file)}
                                            className="w-full text-left p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center gap-4 group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                                                {file.type.includes('text') ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{file.type.split('/')[1] || file.type} • {(file.size! / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-teal-500 text-black px-3 py-1 rounded-full text-[10px] font-bold">SELECT</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-600">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-2m-6 4h6m-3-4v4m-3-12h.01M12 3h.01M15 3h.01M18 3h.01M21 6h.01M21 9h.01M21 12h.01M3 6h.01M3 9h.01M3 12h.01" /></svg>
                                    </div>
                                    <h3 className="text-gray-300 font-semibold">No compatible files found</h3>
                                    <p className="text-sm text-gray-500 mt-1 max-w-[200px]">Connect your account to browse and import your files directly.</p>
                                    <button 
                                        onClick={() => handleConnect(activeProvider)}
                                        className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Connect Account
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <footer className="p-4 border-t border-white/10 bg-black/40 text-[10px] text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span>Your connection is encrypted and your files are processed securely. We don't store your cloud credentials.</span>
                </footer>
            </motion.div>
        </motion.div>
    );
};

interface ProviderTabProps {
    id: CloudProvider;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const ProviderTab: React.FC<ProviderTabProps> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-3 rounded-xl transition-all ${
            isActive 
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
        }`}
    >
        <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
        <span className="text-[10px] sm:text-sm font-semibold hidden sm:inline">{label}</span>
    </button>
);

export default CloudPicker;
