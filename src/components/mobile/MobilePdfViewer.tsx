import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Loader2 } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MobilePdfViewerProps {
    url: string;
    fileName: string;
    onClose: () => void;
}

export function MobilePdfViewer({ url, fileName, onClose }: MobilePdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Touch gesture states
    const containerRef = useRef<HTMLDivElement>(null);
    const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
    const [initialScale, setInitialScale] = useState<number>(1);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    // Responsive width based on container
    const [pageWidth, setPageWidth] = useState<number>(window.innerWidth - 32);

    useEffect(() => {
        const updateWidth = () => {
            setPageWidth(window.innerWidth - 32);
        };
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
    }, []);

    const onDocumentLoadError = useCallback((err: Error) => {
        console.error('PDF load error:', err);
        setError('Impossible de charger le PDF');
        setLoading(false);
    }, []);

    const goToPrevPage = useCallback(() => {
        setPageNumber(prev => Math.max(1, prev - 1));
    }, []);

    const goToNextPage = useCallback(() => {
        setPageNumber(prev => Math.min(numPages, prev + 1));
    }, [numPages]);

    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(3, prev + 0.25));
    }, []);

    const zoomOut = useCallback(() => {
        setScale(prev => Math.max(0.5, prev - 0.25));
    }, []);

    // Calculate distance between two touch points
    const getTouchDistance = (touches: React.TouchList): number => {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Handle touch start for gestures
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch gesture start
            const distance = getTouchDistance(e.touches);
            setInitialPinchDistance(distance);
            setInitialScale(scale);
        } else if (e.touches.length === 1) {
            // Swipe gesture start
            setTouchStartX(e.touches[0].clientX);
        }
    }, [scale]);

    // Handle touch move for pinch-to-zoom
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && initialPinchDistance !== null) {
            e.preventDefault();
            const currentDistance = getTouchDistance(e.touches);
            const scaleChange = currentDistance / initialPinchDistance;
            const newScale = Math.min(3, Math.max(0.5, initialScale * scaleChange));
            setScale(newScale);
        }
    }, [initialPinchDistance, initialScale]);

    // Handle touch end for swipe navigation
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (initialPinchDistance !== null) {
            setInitialPinchDistance(null);
        }

        if (touchStartX !== null && e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;

            // Swipe threshold of 50px
            if (Math.abs(diff) > 50 && scale <= 1.1) {
                if (diff > 0) {
                    // Swipe left -> next page
                    goToNextPage();
                } else {
                    // Swipe right -> prev page
                    goToPrevPage();
                }
            }
            setTouchStartX(null);
        }
    }, [initialPinchDistance, touchStartX, scale, goToNextPage, goToPrevPage]);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800">
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 text-slate-400 hover:text-white"
                >
                    <X size={24} />
                </button>
                <div className="flex-1 mx-4 text-center">
                    <p className="text-sm font-medium text-white truncate">{fileName}</p>
                    {numPages > 0 && (
                        <p className="text-xs text-slate-500">{pageNumber} / {numPages}</p>
                    )}
                </div>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* PDF Content */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto flex items-start justify-center p-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: scale > 1.1 ? 'pan-x pan-y' : 'none' }}
            >
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-4">
                            <p className="text-rose-400 mb-2">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}

                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                    className="pdf-document"
                >
                    <Page
                        pageNumber={pageNumber}
                        width={pageWidth * scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={null}
                        className="shadow-2xl rounded-lg overflow-hidden"
                    />
                </Document>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-sm border-t border-slate-800">
                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="p-2 bg-slate-800 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="p-2 bg-slate-800 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Zoom Level Indicator */}
                <span className="text-xs text-slate-500 font-mono">
                    {Math.round(scale * 100)}%
                </span>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                        className="p-2 bg-slate-800 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <button
                        onClick={zoomIn}
                        disabled={scale >= 3}
                        className="p-2 bg-slate-800 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    >
                        <ZoomIn size={20} />
                    </button>
                </div>
            </div>

            {/* Gesture Hint (shown briefly) */}
            <GestureHint />
        </div>
    );
}

// Component to show gesture hints on first view
function GestureHint() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-xs text-slate-300">
                Pincez pour zoomer, glissez pour changer de page
            </p>
        </div>
    );
}
