'use client';

import { useEffect, useState } from 'react';

export default function PreviewPage({ params }: { params: { id: string } }) {
    const [html, setHtml] = useState<string>('');
    const [css, setCss] = useState<string>('');

    useEffect(() => {
        const screens = JSON.parse(localStorage.getItem('previewScreens') || '[]');
        const screen = screens[parseInt(params.id)];

        if (screen) {
            setHtml(screen.html);
            setCss(screen.css);
        }
    }, [params.id]);

    return (
        <div>
            <style>{css}</style>
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
} 