import React from 'react';
import type { ImageTagsResult } from '../../types';
import { ClipboardIcon, CheckIcon } from '../Icons';

const CATEGORY_COLORS: Record<string, string> = {
    subjects: 'bg-teal-500/15 border-teal-500/25 text-teal-300',
    objects: 'bg-blue-500/15 border-blue-500/25 text-blue-300',
    setting: 'bg-amber-500/15 border-amber-500/25 text-amber-300',
    style: 'bg-violet-500/15 border-violet-500/25 text-violet-300',
    colors: 'bg-pink-500/15 border-pink-500/25 text-pink-300',
    composition: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300',
};

interface Props {
    tags: ImageTagsResult;
}

const TagsView: React.FC<Props> = ({ tags }) => {
    const [copied, setCopied] = React.useState(false);

    const entries = Object.entries(tags) as [keyof ImageTagsResult, string[]][];
    const allTags = entries.flatMap(([, vals]) => vals || []);

    const copyAll = () => {
        navigator.clipboard.writeText(allTags.join(', ')).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-purple-300">🏷 Tags</h3>
                <button onClick={copyAll} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                    {copied ? <CheckIcon /> : <ClipboardIcon />} {copied ? 'Copied!' : 'Copy All'}
                </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {entries.map(([category, values]) =>
                    (values || []).map((tag, i) => (
                        <span
                            key={`${category}-${i}`}
                            className={`px-2 py-0.5 rounded-full border text-xs ${CATEGORY_COLORS[category] ?? 'bg-slate-500/15 border-slate-500/25 text-slate-300'}`}
                        >
                            {tag}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
};

export default TagsView;
