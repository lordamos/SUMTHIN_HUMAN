
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { WritingStyleProfile } from '../types';

interface WritingStyleSetupProps {
    onSave: (profile: WritingStyleProfile) => void;
    onClose: () => void;
    initialProfile: WritingStyleProfile | null;
}

const exampleDescriptions = [
    "Casual and conversational",
    "Formal and academic",
    "Witty and humorous",
    "Direct and concise",
    "Empathetic and warm",
    "Persuasive and bold"
];

const WritingStyleSetup: React.FC<WritingStyleSetupProps> = ({ onSave, onClose, initialProfile }) => {
    const [profile, setProfile] = useState<WritingStyleProfile>({
        description: '',
        tone: 'Neutral',
        useContractions: 'yes',
        complexity: 'simple',
        sample: ''
    });

    useEffect(() => {
        if (initialProfile) {
            setProfile(initialProfile);
        }
    }, [initialProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if ((name === 'useContractions' && (value === 'yes' || value === 'no')) || 
            (name === 'complexity' && (value === 'simple' || value === 'complex'))) {
          setProfile(prev => ({ ...prev, [name]: value as any }));
        }
    };

    const handleSave = () => {
        // Basic validation
        if (!profile.description.trim() || !profile.sample.trim()) {
            alert("Please fill out the 'Style Description' and 'Writing Sample' fields.");
            return;
        }
        onSave(profile);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-gray-800 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-gray-100">Personalize Your Writing Style</h2>
                    <p className="text-sm text-gray-400 mt-1">Teach the AI to write like you. This profile will guide the "Humanize" feature.</p>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto">
                    {/* Style Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">1. Describe your writing style in a few words.</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={profile.description}
                            onChange={handleChange}
                            placeholder="e.g., Casual and witty, formal and academic, direct"
                            className="w-full p-2 bg-black/20 rounded-lg outline-none border border-white/10 placeholder:text-gray-500 focus:ring-1 focus:ring-teal-400 mb-2"
                        />
                         <div className="flex flex-wrap gap-2">
                            {exampleDescriptions.map((desc, index) => (
                                <button
                                    key={index}
                                    onClick={() => setProfile(prev => ({ ...prev, description: desc }))}
                                    className="px-2 py-1 text-xs rounded-md bg-white/5 border border-white/10 text-gray-400 hover:text-teal-300 hover:border-teal-400/30 transition-colors"
                                >
                                    {desc}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tone */}
                    <div>
                         <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-1">2. What is your typical tone?</label>
                         <select
                            id="tone"
                            name="tone"
                            value={profile.tone}
                            onChange={handleChange}
                            className="w-full p-2 bg-black/20 rounded-lg outline-none border border-white/10 focus:ring-1 focus:ring-teal-400 appearance-none"
                         >
                            <option>Friendly</option>
                            <option>Neutral</option>
                            <option>Formal</option>
                            <option>Authoritative</option>
                            <option>Witty</option>
                            <option>Academic</option>
                         </select>
                    </div>

                    {/* Contractions & Complexity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">3. Do you use contractions? <span className="text-gray-400">(e.g., don't, can't)</span></label>
                            <div className="flex gap-4">
                                <RadioOption name="useContractions" value="yes" checked={profile.useContractions === 'yes'} onChange={handleRadioChange} label="Yes" />
                                <RadioOption name="useContractions" value="no" checked={profile.useContractions === 'no'} onChange={handleRadioChange} label="No" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">4. Do you prefer simple or complex vocabulary?</label>
                            <div className="flex gap-4">
                                <RadioOption name="complexity" value="simple" checked={profile.complexity === 'simple'} onChange={handleRadioChange} label="Simple" />
                                <RadioOption name="complexity" value="complex" checked={profile.complexity === 'complex'} onChange={handleRadioChange} label="Complex" />
                            </div>
                        </div>
                    </div>

                    {/* Writing Sample */}
                    <div>
                        <label htmlFor="sample" className="block text-sm font-medium text-gray-300 mb-1">5. Paste a sample of your writing. <span className="text-gray-400">(~50-200 words is best)</span></label>
                         <textarea
                            id="sample"
                            name="sample"
                            value={profile.sample}
                            onChange={handleChange}
                            rows={5}
                            placeholder="Provide a text that best represents your unique voice..."
                            className="w-full p-2 bg-black/20 rounded-lg outline-none border border-white/10 placeholder:text-gray-500 focus:ring-1 focus:ring-teal-400"
                        />
                    </div>
                </main>

                <footer className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-all transform hover:-translate-y-0.5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-teal-500/80 to-amber-400/50 text-white font-semibold hover:scale-105 transition-all transform"
                    >
                        Save Profile
                    </button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

interface RadioOptionProps {
    name: string;
    value: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}

const RadioOption: React.FC<RadioOptionProps> = ({ name, value, checked, onChange, label }) => (
    <label className="flex items-center gap-2 cursor-pointer">
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            className="hidden"
        />
        <div className={`w-5 h-5 rounded-full border-2 ${checked ? 'border-teal-400' : 'border-gray-500'} flex items-center justify-center`}>
             {checked && <div className="w-2.5 h-2.5 bg-teal-400 rounded-full"></div>}
        </div>
        <span className="text-sm text-gray-200">{label}</span>
    </label>
);


export default WritingStyleSetup;
