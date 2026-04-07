import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export default function PdfPageViewer({ pdfUrl, pageNumber, maxWidth = 600 }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pdfUrl || !pageNumber) return;
    
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    const loadPage = async () => {
      try {
        const doc = await pdfjsLib.getDocument(pdfUrl).promise;
        if (cancelled) return;
        
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(maxWidth / viewport.width, 2); // cap at 2x
        const scaledViewport = page.getViewport({ scale });
        
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        const context = canvas.getContext('2d');
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
        
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError('Could not load question image');
          setLoading(false);
        }
      }
    };
    
    loadPage();
    return () => { cancelled = true; };
  }, [pdfUrl, pageNumber, maxWidth]);

  if (!pdfUrl || !pageNumber) return null;

  return (
    <div className="mb-4">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full" />
          Loading question image...
        </div>
      )}
      {error && (
        <p className="text-sm text-amber-500 py-2">{error}</p>
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-lg border border-gray-200 max-w-full ${loading ? 'hidden' : ''}`}
        style={{ maxWidth: `${maxWidth}px` }}
      />
    </div>
  );
}
