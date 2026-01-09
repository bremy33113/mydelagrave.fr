import { X } from 'lucide-react';

interface PhotoModalProps {
    url: string | null;
    onClose: () => void;
}

export function PhotoModal({ url, onClose }: PhotoModalProps) {
    if (!url) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={onClose}
        >
            <div className="relative max-w-4xl max-h-[90vh] p-2">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
                <img
                    src={url}
                    alt="Photo agrandie"
                    className="max-w-full max-h-[85vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}
