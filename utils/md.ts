/**
 * Lightweight markdown → HTML renderer for AI-generated text.
 * Handles headings, bold, italic, bullet lists and line breaks.
 * Returns a string of safe HTML (no user-controlled input is ever passed here;
 * all content comes from Gemini API responses).
 */
export function renderMd(text: string): string {
    if (!text) return '';

    const lines = text.split('\n');
    const out: string[] = [];
    let inList = false;

    for (const raw of lines) {
        const line = raw.trimEnd();

        const h3 = line.match(/^### (.+)/);
        const h2 = line.match(/^## (.+)/);
        const h1 = line.match(/^# (.+)/);
        const bullet = line.match(/^[-*] (.+)/);

        if (h3 || h2 || h1) {
            if (inList) { out.push('</ul>'); inList = false; }
            const content = inline((h3 || h2 || h1)![1]);
            if (h3) out.push(`<h3 class="text-sm font-bold text-gray-200 mt-3 mb-1">${content}</h3>`);
            else if (h2) out.push(`<h2 class="text-base font-bold text-gray-100 mt-4 mb-1">${content}</h2>`);
            else out.push(`<h1 class="text-lg font-bold text-white mt-4 mb-2">${content}</h1>`);
        } else if (bullet) {
            if (!inList) { out.push('<ul class="list-disc list-inside space-y-0.5 my-1">'); inList = true; }
            out.push(`<li class="text-sm leading-relaxed">${inline(bullet[1])}</li>`);
        } else {
            if (inList) { out.push('</ul>'); inList = false; }
            if (line === '') {
                out.push('<br/>');
            } else {
                out.push(`<span class="block leading-relaxed">${inline(line)}</span>`);
            }
        }
    }
    if (inList) out.push('</ul>');
    return out.join('');
}

function inline(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>');
}

/**
 * React helper — use with dangerouslySetInnerHTML.
 * Example: <div dangerouslySetInnerHTML={md(text)} />
 */
export const md = (text: string) => ({ __html: renderMd(text) });
