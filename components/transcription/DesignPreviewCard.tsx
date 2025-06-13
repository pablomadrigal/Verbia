import React, { useEffect, useRef, useState } from 'react';
import { HtmlScreen } from '@/app/api/generate-html/route';

const DesignPreviewCard = ({ html, css = '', name = "Mini Preview" }: HtmlScreen) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleTitleClick = () => {
        const content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${name}</title>
            <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css">
            <style>
                body { 
                    margin: 0; 
                    padding: 1rem;
                    min-height: 100vh;
                    background: white;
                }
                .container {
                    max-width: 100%;
                    padding: 0;
                }
                ${css || ''}
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
        `;
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    useEffect(() => {
        console.log(`[DesignPreviewCard] Starting iframe creation for ${name}`, {
            htmlLength: html?.length || 0,
            cssLength: css?.length || 0
        });

        if (iframeRef.current && html) {
            console.log('[DesignPreviewCard] Initializing iframe content');
            setIsLoading(true);
            const iframe = iframeRef.current;
            const doc = iframe?.contentDocument || iframe?.contentWindow?.document;

            if (!doc) {
                console.error('[DesignPreviewCard] Failed to get iframe document');
                return;
            }

            console.log('[DesignPreviewCard] Building content with:', {
                hasHtml: !!html,
                hasCss: !!css,
                htmlLength: html.length,
                cssLength: css.length
            });

            const content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>
            <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css">
            <style>
                body { 
                    margin: 0; 
                    padding: 1rem;
                    min-height: 100vh;
                    background: white;
                }
                .container {
                    max-width: 100%;
                    padding: 0;
                }
                ${css || ''}
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
      `;

            console.log('[DesignPreviewCard] Writing content to iframe');
            doc.open();
            doc.write(content);
            doc.close();
            console.log('[DesignPreviewCard] Content written to iframe');

            // Wait for iframe content to load
            iframe.onload = () => {
                console.log('[DesignPreviewCard] Iframe content loaded');
                setIsLoading(false);
            };

            iframe.onerror = (error) => {
                console.error('[DesignPreviewCard] Iframe loading error:', error);
                setIsLoading(false);
            };
        } else {
            console.warn('[DesignPreviewCard] Missing required props:', {
                hasIframeRef: !!iframeRef.current,
                hasHtml: !!html,
                hasCss: !!css
            });
        }
    }, [html, css, name]);

    return (
        <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            margin: '20px',
            width: '400px',
            height: '600px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            backgroundColor: 'white'
        }}>
            <h3
                onClick={handleTitleClick}
                style={{
                    margin: 0,
                    padding: '10px 15px',
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    fontSize: '1em',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >{name}</h3>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    zIndex: 10
                }}>
                    Loading preview...
                </div>
            )}
            <iframe
                ref={iframeRef}
                style={{
                    width: '100%',
                    height: 'calc(100% - 40px)',
                    border: 'none',
                    backgroundColor: 'white',
                    overflow: 'auto'
                }}
                sandbox="allow-same-origin"
                title="Design Preview"
            ></iframe>
        </div>
    );
};

export default DesignPreviewCard;