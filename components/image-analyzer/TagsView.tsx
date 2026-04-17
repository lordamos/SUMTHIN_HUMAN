import React from 'react';
import type { ImageTagsResult } from '../../types';
import { ClipboardIcon, CheckIcon } from '../Icons';

interface Props {
    tags: ImageTagsResult;
}

const TagsView: React.FC<Props> = ({ tags }) => {
    const [copied, setCopied] = React.useState(false);

    const allTags = [...(tags.objects || []), ...(tags.styles || []), ...(tags.moods || []), ...(tags.technical || [])];

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
                {(tags.objects || []).map((t, i) => (
                    <span key={`obj-${i}`} className="px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300 text-xs">{t}</span>
                ))}
                {(tags.styles || []).map((t, i) => (
                    <span key={`sty-${i}`} className="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs">{t}</span>
                ))}
                {(tags.moods || []).map((t, i) => (
                    <span key={`mood-${i}`} className="px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/25 text-pink-300 text-xs">{t}</span>
                ))}
                {(tags.technical || []).map((t, i) => (
                    <span key={`tech-${i}`} className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs">{t}</span>
                ))}
            </div>
        </div>
    );
};

export default TagsView;
