import { useState, useEffect } from 'react';
import { ChevronDown, Plus, File, Eye, Download, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DocumentUploadModal } from './DocumentUploadModal';
import type { Document } from './types';

interface ChantierDocumentsSectionProps {
    chantierId: string;
    defaultExpanded?: boolean;
}

export function ChantierDocumentsSection({
    chantierId,
    defaultExpanded = true,
}: ChantierDocumentsSectionProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch documents
    useEffect(() => {
        const fetchDocuments = async () => {
            const { data } = await supabase
                .from('documents_chantiers')
                .select('*, uploader:users!uploaded_by(first_name, last_name)')
                .eq('chantier_id', chantierId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            setDocuments((data as Document[]) || []);
        };
        fetchDocuments();
    }, [chantierId, refreshKey]);

    // Load signed URL for document preview
    useEffect(() => {
        const loadPreviewUrl = async () => {
            if (!previewDocument?.storage_path) {
                setPreviewUrl(null);
                return;
            }
            const { data } = await supabase.storage
                .from('documents')
                .createSignedUrl(previewDocument.storage_path, 3600);
            setPreviewUrl(data?.signedUrl || null);
        };
        loadPreviewUrl();
    }, [previewDocument]);

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Supprimer ce document ?')) return;
        await supabase
            .from('documents_chantiers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', docId);
        setRefreshKey((n) => n + 1);
    };

    const handleDownloadDocument = async (doc: Document) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.storage_path, 3600);

            if (error) {
                console.error('Erreur création URL signée:', error);
                alert('Erreur lors du téléchargement: ' + error.message);
                return;
            }

            if (data?.signedUrl) {
                const link = document.createElement('a');
                link.href = data.signedUrl;
                link.download = doc.nom;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (err) {
            console.error('Erreur téléchargement:', err);
            alert('Erreur lors du téléchargement');
        }
    };

    const getDocumentTypeIcon = (type: string): string => {
        const icons: Record<string, string> = {
            plan: '📐',
            devis: '💰',
            rapport: '📄',
            reserve: '📋',
        };
        return icons[type] || '📎';
    };

    const getDocumentTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            plan: 'Plan',
            devis: 'Devis',
            rapport: 'Rapport',
            reserve: 'Réserves',
        };
        return labels[type] || type;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' o';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
        return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    };

    return (
        <>
            <section className="glass-card p-4" data-testid="section-documents">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-2 text-left"
                        data-testid="btn-toggle-documents"
                    >
                        <ChevronDown
                            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                expanded ? '' : '-rotate-90'
                            }`}
                        />
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                            <File className="w-4 h-4" />
                            Documents
                            <span className="text-xs font-normal" data-testid="documents-count">
                                ({documents.length})
                            </span>
                        </h3>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowUploadModal(true);
                            setExpanded(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                        title="Ajouter un document"
                        data-testid="btn-add-document"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {expanded && (
                    <div className="mt-3">
                        <div className="border-t border-slate-700/50 pt-4" data-testid="documents-list">
                            {documents.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">Aucun document</p>
                            ) : (
                                <div className="divide-y divide-slate-700/50 max-h-60 overflow-y-auto">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-2 p-2 hover:bg-slate-800/30 group"
                                            data-testid={`document-item-${doc.id}`}
                                        >
                                            {/* Nom du fichier - 30% */}
                                            <div className="w-[30%] min-w-0">
                                                <p className="text-sm text-white truncate" title={doc.nom}>
                                                    {doc.nom}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatFileSize(doc.file_size)} •{' '}
                                                    {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            {/* Type de document - 15% */}
                                            <div className="w-[15%] shrink-0">
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                                                    {getDocumentTypeIcon(doc.type)}{' '}
                                                    {getDocumentTypeLabel(doc.type)}
                                                </span>
                                            </div>
                                            {/* Description - 25% */}
                                            <div className="w-[25%] min-w-0">
                                                <p
                                                    className="text-xs text-slate-400 truncate"
                                                    title={doc.description || ''}
                                                >
                                                    {doc.description || (
                                                        <span className="text-slate-600 italic">—</span>
                                                    )}
                                                </p>
                                            </div>
                                            {/* Déposé par - 20% */}
                                            <div className="w-[20%] min-w-0">
                                                <p className="text-xs text-slate-400 truncate">
                                                    {doc.uploader
                                                        ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() ||
                                                          '—'
                                                        : '—'}
                                                </p>
                                            </div>
                                            {/* Actions - 10% */}
                                            <div className="w-[10%] flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {doc.mime_type.startsWith('image/') && (
                                                    <button
                                                        onClick={() => setPreviewDocument(doc)}
                                                        className="p-1 text-slate-400 hover:text-blue-400"
                                                        title="Prévisualiser"
                                                        data-testid={`btn-preview-document-${doc.id}`}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadDocument(doc)}
                                                    className="p-1 text-slate-400 hover:text-green-400"
                                                    title="Télécharger"
                                                    data-testid={`btn-download-document-${doc.id}`}
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="p-1 text-slate-400 hover:text-red-400"
                                                    title="Supprimer"
                                                    data-testid={`btn-delete-document-${doc.id}`}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* Document Preview Modal */}
            {previewDocument && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setPreviewDocument(null)}
                    data-testid="document-preview-modal"
                >
                    <div className="relative max-w-4xl max-h-[90vh] p-2">
                        <button
                            onClick={() => setPreviewDocument(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                            data-testid="btn-close-preview"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="bg-slate-900 rounded-lg p-4">
                            <p className="text-white font-medium mb-2" data-testid="preview-filename">
                                {previewDocument.nom}
                            </p>
                            {previewDocument.mime_type.startsWith('image/') && previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt={previewDocument.nom}
                                    className="max-w-full max-h-[75vh] object-contain rounded-lg"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid="preview-image"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Document Upload Modal */}
            {showUploadModal && (
                <DocumentUploadModal
                    chantierId={chantierId}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        setRefreshKey((n) => n + 1);
                    }}
                />
            )}
        </>
    );
}
