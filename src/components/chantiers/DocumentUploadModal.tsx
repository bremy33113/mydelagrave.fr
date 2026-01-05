import { useState, useEffect, useRef } from 'react';
import { X, Upload, File } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

interface DocumentUploadModalProps {
    chantierId: string;
    onClose: () => void;
    onSuccess: () => void;
}

type RefTypeDocument = Tables<'ref_types_document'>;

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function DocumentUploadModal({ chantierId, onClose, onSuccess }: DocumentUploadModalProps) {
    const [documentTypes, setDocumentTypes] = useState<RefTypeDocument[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [description, setDescription] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch document types
    useEffect(() => {
        const fetchTypes = async () => {
            const { data } = await supabase
                .from('ref_types_document')
                .select('*')
                .order('ordre', { ascending: true });
            if (data && Array.isArray(data)) {
                const types = data as RefTypeDocument[];
                setDocumentTypes(types);
                if (types.length > 0) {
                    setSelectedType(types[0].id);
                }
            }
        };
        fetchTypes();
    }, []);

    const handleFileSelect = (selectedFile: File | null) => {
        setError(null);

        if (!selectedFile) {
            setFile(null);
            setPreview(null);
            return;
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Type de fichier non supporté. Formats acceptés: JPEG, PNG, GIF, PDF');
            return;
        }

        // Validate file size
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('Le fichier est trop volumineux (max 5 Mo)');
            return;
        }

        setFile(selectedFile);
        setFileName(selectedFile.name);

        // Generate preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        handleFileSelect(droppedFile);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleSubmit = async () => {
        if (!file || !selectedType || !fileName.trim()) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData?.user?.id) {
                throw new Error('Utilisateur non connecté');
            }

            // Generate unique storage path
            const timestamp = Date.now();
            const storagePath = `chantier_${chantierId}/${timestamp}_${file.name}`;

            // Upload file to storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(storagePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Save document metadata
            const { error: insertError } = await supabase
                .from('documents_chantiers')
                .insert([{
                    chantier_id: chantierId,
                    type: selectedType,
                    nom: fileName.trim(),
                    description: description.trim() || null,
                    storage_path: storagePath,
                    file_size: file.size,
                    mime_type: file.type,
                    uploaded_by: userData.user.id,
                    deleted_at: null,
                }]);

            if (insertError) {
                throw insertError;
            }

            onSuccess();
        } catch (err) {
            console.error('Erreur upload document:', err);
            setError((err as Error).message || 'Erreur lors de l\'upload');
        } finally {
            setIsUploading(false);
        }
    };

    const getTypeIcon = (type: string): string => {
        const icons: Record<string, string> = {
            plan: '📐',
            devis: '💰',
            rapport: '📄',
            reserve: '📋',
        };
        return icons[type] || '📎';
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="text-lg font-semibold text-white">Ajouter un document</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Document type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Type de document *
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            data-testid="document-type-select"
                        >
                            {documentTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {getTypeIcon(type.id)} {type.libelle}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* File drop zone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Fichier *
                        </label>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                isDragging
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : file
                                    ? 'border-green-500/50 bg-green-500/5'
                                    : 'border-slate-700 hover:border-slate-600'
                            }`}
                            data-testid="document-dropzone"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ALLOWED_TYPES.join(',')}
                                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                className="hidden"
                                data-testid="document-file-input"
                            />
                            {file ? (
                                <div className="space-y-2">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Aperçu"
                                            className="max-h-32 mx-auto rounded-lg"
                                        />
                                    ) : (
                                        <File className="w-12 h-12 mx-auto text-slate-400" />
                                    )}
                                    <p className="text-sm text-white">{file.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {(file.size / 1024).toFixed(1)} Ko
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-8 h-8 mx-auto text-slate-500" />
                                    <p className="text-sm text-slate-400">
                                        Glissez-déposez ou cliquez pour sélectionner
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        JPEG, PNG, GIF, PDF (max 5 Mo)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nom du document *
                        </label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="Nom du fichier"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            data-testid="document-name-input"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description (optionnel)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description du document..."
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                            data-testid="document-description-input"
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        disabled={isUploading}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || !selectedType || !fileName.trim() || isUploading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        data-testid="document-submit-btn"
                    >
                        {isUploading ? 'Envoi en cours...' : 'Ajouter'}
                    </button>
                </div>
            </div>
        </div>
    );
}
