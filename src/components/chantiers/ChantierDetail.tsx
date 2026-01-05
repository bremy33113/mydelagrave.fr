import { useState, useEffect, useRef } from 'react';
import {
    MapPin,
    Building2,
    Phone,
    Mail,
    Edit,
    Trash2,
    FileText,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    ChevronDown,
    Plus,
    Pencil,
    X,
    Image,
    Download,
    Eye,
    File,
} from 'lucide-react';
import { DocumentUploadModal } from './DocumentUploadModal';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

type Note = Tables<'notes_chantiers'> & {
    creator?: { first_name: string; last_name: string } | null;
};

type Document = Tables<'documents_chantiers'> & {
    uploader?: { first_name: string; last_name: string } | null;
    ref_types_document?: Tables<'ref_types_document'> | null;
};

type Chantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
    charge_affaire?: Tables<'users'> | null;
    ref_categories_chantier?: Tables<'ref_categories_chantier'> | null;
    ref_statuts_chantier?: Tables<'ref_statuts_chantier'> | null;
};

interface ChantierDetailProps {
    chantier: Chantier;
    onEdit?: () => void;
    onDelete?: () => void;
    onManagePhases?: () => void;
    onManageContacts?: () => void;
}

export function ChantierDetail({
    chantier,
    onEdit,
    onDelete,
    onManagePhases,
    onManageContacts,
}: ChantierDetailProps) {
    const [coordonneesExpanded, setCoordonneesExpanded] = useState(true);
    const [informationsExpanded, setInformationsExpanded] = useState(true);
    const [documentsExpanded, setDocumentsExpanded] = useState(true);

    // Notes state
    const [notes, setNotes] = useState<Note[]>([]);
    const [notesRefresh, setNotesRefresh] = useState(0);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [notePhoto1, setNotePhoto1] = useState<string | null>(null);
    const [notePhoto2, setNotePhoto2] = useState<string | null>(null);
    const [photoModal, setPhotoModal] = useState<string | null>(null);
    const photo1InputRef = useRef<HTMLInputElement>(null);
    const photo2InputRef = useRef<HTMLInputElement>(null);

    // Documents state
    const [documents, setDocuments] = useState<Document[]>([]);
    const [documentsRefresh, setDocumentsRefresh] = useState(0);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [documentPreview, setDocumentPreview] = useState<Document | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch notes
    useEffect(() => {
        const fetchNotes = async () => {
            const { data } = await supabase
                .from('notes_chantiers')
                .select('*')
                .eq('chantier_id', chantier.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            setNotes((data as Note[]) || []);
        };
        fetchNotes();
    }, [chantier.id, notesRefresh]);

    // Fetch documents
    useEffect(() => {
        const fetchDocuments = async () => {
            const { data } = await supabase
                .from('documents_chantiers')
                .select('*, uploader:users!uploaded_by(first_name, last_name)')
                .eq('chantier_id', chantier.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            setDocuments((data as Document[]) || []);
        };
        fetchDocuments();
    }, [chantier.id, documentsRefresh]);

    // Load signed URL for document preview
    useEffect(() => {
        const loadPreviewUrl = async () => {
            if (!documentPreview?.storage_path) {
                setPreviewUrl(null);
                return;
            }
            const { data } = await supabase.storage
                .from('documents')
                .createSignedUrl(documentPreview.storage_path, 3600);
            setPreviewUrl(data?.signedUrl || null);
        };
        loadPreviewUrl();
    }, [documentPreview]);

    const resetNoteForm = () => {
        setShowNoteForm(false);
        setEditingNote(null);
        setNoteContent('');
        setNotePhoto1(null);
        setNotePhoto2(null);
    };

    const handleSaveNote = async () => {
        try {
            const { data: userData } = await supabase.auth.getUser();

            if (editingNote) {
                await supabase
                    .from('notes_chantiers')
                    .update({
                        contenu: noteContent || null,
                        photo_1_url: notePhoto1,
                        photo_2_url: notePhoto2,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingNote.id);
            } else {
                const { error } = await supabase.from('notes_chantiers').insert([{
                    chantier_id: chantier.id,
                    contenu: noteContent || null,
                    photo_1_url: notePhoto1,
                    photo_2_url: notePhoto2,
                    created_by: userData?.user?.id || null,
                    deleted_at: null,
                }]);
                if (error) {
                    console.error('Insert error:', error);
                    alert('Erreur: ' + error.message);
                    return;
                }
            }

            resetNoteForm();
            setNotesRefresh((n) => n + 1);
        } catch (err) {
            console.error('Erreur sauvegarde note:', err);
            alert('Erreur: ' + (err as Error).message);
        }
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setNoteContent(note.contenu || '');
        setNotePhoto1(note.photo_1_url);
        setNotePhoto2(note.photo_2_url);
        setShowNoteForm(true);
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Supprimer cette note ?')) return;
        await supabase
            .from('notes_chantiers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', noteId);
        setNotesRefresh((n) => n + 1);
    };

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        slot: 'photo1' | 'photo2'
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Compress and convert to base64 (small size for localStorage)
        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (event) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 300; // Reduced for localStorage limits
                let { width, height } = img;

                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL('image/jpeg', 0.5);
                if (slot === 'photo1') {
                    setNotePhoto1(compressed);
                } else {
                    setNotePhoto2(compressed);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Document handlers
    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Supprimer ce document ?')) return;
        await supabase
            .from('documents_chantiers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', docId);
        setDocumentsRefresh((n) => n + 1);
    };

    const handleDownloadDocument = async (doc: Document) => {
        try {
            // Get signed URL for private bucket (valid for 1 hour)
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.storage_path, 3600);

            if (error) {
                console.error('Erreur création URL signée:', error);
                alert('Erreur lors du téléchargement: ' + error.message);
                return;
            }

            if (data?.signedUrl) {
                // Create download link
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
        <div className="h-full flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-700/50 flex items-center justify-center text-2xl">
                            {chantier.ref_categories_chantier?.icon || '📦'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{chantier.nom}</h2>
                            {chantier.reference && (
                                <p className="text-slate-400">Réf: {chantier.reference}</p>
                            )}
                            {chantier.ref_categories_chantier && (
                                <div className="mt-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">
                                        <span>{chantier.ref_categories_chantier.icon}</span>
                                        {chantier.ref_categories_chantier.label}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                                    title="Modifier"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    title="Supprimer"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onManagePhases}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm"
                                title="Gérer les phases"
                            >
                                <Clock className="w-4 h-4" />
                                Phases
                            </button>
                            <button
                                onClick={onManageContacts}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                                title="Gérer les contacts"
                            >
                                <Users className="w-4 h-4" />
                                Contacts
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">

                {/* Coordonnées chantier */}
                {(chantier.client || chantier.adresse_livraison) && (
                    <section className="glass-card p-4">
                        <button
                            onClick={() => setCoordonneesExpanded(!coordonneesExpanded)}
                            className="w-full flex items-center gap-2 text-left"
                        >
                            <ChevronDown
                                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                    coordonneesExpanded ? '' : '-rotate-90'
                                }`}
                            />
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Coordonnées chantier
                            </h3>
                        </button>
                        {coordonneesExpanded && (
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                {/* Client */}
                                {chantier.client && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-500 uppercase">Client principal</p>
                                        <p className="text-base font-medium text-white">{chantier.client.nom}</p>
                                        {chantier.client.entreprise && (
                                            <p className="text-sm text-slate-400">{chantier.client.entreprise}</p>
                                        )}
                                        {chantier.client.adresse && (
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <MapPin className="w-3 h-3" />
                                                <span>{chantier.client.adresse}</span>
                                            </div>
                                        )}
                                        {chantier.client.email && (
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Mail className="w-3 h-3" />
                                                <a
                                                    href={`mailto:${chantier.client.email}`}
                                                    className="hover:text-blue-400 transition-colors truncate"
                                                >
                                                    {chantier.client.email}
                                                </a>
                                            </div>
                                        )}
                                        {chantier.client.telephone && (
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Phone className="w-3 h-3" />
                                                <a
                                                    href={`tel:${chantier.client.telephone}`}
                                                    className="hover:text-blue-400 transition-colors"
                                                >
                                                    {chantier.client.telephone}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Adresse livraison */}
                                {chantier.adresse_livraison && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-500 uppercase">Adresse de livraison</p>
                                        <p className="text-sm text-white">{chantier.adresse_livraison}</p>
                                        <a
                                            href={
                                                chantier.adresse_livraison_latitude && chantier.adresse_livraison_longitude
                                                    ? `https://www.google.com/maps?q=${chantier.adresse_livraison_latitude},${chantier.adresse_livraison_longitude}`
                                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chantier.adresse_livraison)}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            Voir sur Google Maps
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Dates & Charge d'affaires + Notes */}
                <section className="glass-card p-4" data-testid="section-informations">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setInformationsExpanded(!informationsExpanded)}
                            className="flex items-center gap-2 text-left"
                            data-testid="btn-toggle-informations"
                        >
                            <ChevronDown
                                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                    informationsExpanded ? '' : '-rotate-90'
                                }`}
                            />
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Informations
                                <span className="text-xs font-normal" data-testid="notes-count">({notes.length})</span>
                            </h3>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNoteForm(true);
                                setInformationsExpanded(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                            title="Ajouter une note"
                            data-testid="btn-add-note"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {informationsExpanded && (
                        <div className="mt-3 space-y-4">
                            {/* Formulaire inline d'ajout/édition de note */}
                            {showNoteForm && (
                                <div className="border-t border-slate-700/50 pt-4 space-y-3" data-testid="note-form">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500 uppercase">
                                            {editingNote ? 'Modifier la note' : 'Nouvelle note'}
                                        </p>
                                        <button
                                            onClick={resetNoteForm}
                                            className="p-1 text-slate-400 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <textarea
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        placeholder="Contenu de la note..."
                                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-blue-500"
                                        rows={3}
                                        data-testid="note-content-input"
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <input
                                                ref={photo1InputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'photo1')}
                                                className="hidden"
                                            />
                                            {notePhoto1 ? (
                                                <div className="relative">
                                                    <img src={notePhoto1} alt="Photo 1" className="w-16 h-16 object-cover rounded-lg" />
                                                    <button
                                                        onClick={() => setNotePhoto1(null)}
                                                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => photo1InputRef.current?.click()}
                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 text-sm"
                                                >
                                                    <Image className="w-4 h-4" />
                                                    Photo 1
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                ref={photo2InputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'photo2')}
                                                className="hidden"
                                            />
                                            {notePhoto2 ? (
                                                <div className="relative">
                                                    <img src={notePhoto2} alt="Photo 2" className="w-16 h-16 object-cover rounded-lg" />
                                                    <button
                                                        onClick={() => setNotePhoto2(null)}
                                                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => photo2InputRef.current?.click()}
                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 text-sm"
                                                >
                                                    <Image className="w-4 h-4" />
                                                    Photo 2
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={resetNoteForm}
                                            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={!noteContent && !notePhoto1 && !notePhoto2}
                                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            data-testid="btn-submit-note"
                                        >
                                            {editingNote ? 'Modifier' : 'Ajouter'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Liste des notes */}
                            <div className="border-t border-slate-700/50 pt-4" data-testid="notes-section">
                                {notes.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">Aucune note</p>
                                ) : (
                                    <div className="divide-y divide-slate-700/50 max-h-60 overflow-y-auto">
                                        {notes.map((note) => (
                                            <div
                                                key={note.id}
                                                className="flex items-start gap-3 p-2 hover:bg-slate-800/30 group"
                                            >
                                                <span className="text-xs text-slate-500 whitespace-nowrap pt-0.5">
                                                    {new Date(note.created_at).toLocaleDateString('fr-FR')}
                                                </span>
                                                <p className="flex-1 text-sm text-slate-300 line-clamp-2">
                                                    {note.contenu || <span className="italic text-slate-500">Pas de texte</span>}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    {note.photo_1_url && (
                                                        <img
                                                            src={note.photo_1_url}
                                                            alt="Photo 1"
                                                            className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80"
                                                            onClick={() => setPhotoModal(note.photo_1_url)}
                                                        />
                                                    )}
                                                    {note.photo_2_url && (
                                                        <img
                                                            src={note.photo_2_url}
                                                            alt="Photo 2"
                                                            className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80"
                                                            onClick={() => setPhotoModal(note.photo_2_url)}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditNote(note)}
                                                        className="p-1 text-slate-400 hover:text-blue-400"
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="p-1 text-slate-400 hover:text-red-400"
                                                        title="Supprimer"
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

                {/* Documents section */}
                <section className="glass-card p-4" data-testid="section-documents">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setDocumentsExpanded(!documentsExpanded)}
                            className="flex items-center gap-2 text-left"
                            data-testid="btn-toggle-documents"
                        >
                            <ChevronDown
                                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                    documentsExpanded ? '' : '-rotate-90'
                                }`}
                            />
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                <File className="w-4 h-4" />
                                Documents
                                <span className="text-xs font-normal" data-testid="documents-count">({documents.length})</span>
                            </h3>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDocumentModal(true);
                                setDocumentsExpanded(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                            title="Ajouter un document"
                            data-testid="btn-add-document"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {documentsExpanded && (
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
                                                    <p className="text-sm text-white truncate" title={doc.nom}>{doc.nom}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                {/* Type de document - 15% */}
                                                <div className="w-[15%] shrink-0">
                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                                                        {getDocumentTypeIcon(doc.type)} {getDocumentTypeLabel(doc.type)}
                                                    </span>
                                                </div>
                                                {/* Description - 25% */}
                                                <div className="w-[25%] min-w-0">
                                                    <p className="text-xs text-slate-400 truncate" title={doc.description || ''}>
                                                        {doc.description || <span className="text-slate-600 italic">—</span>}
                                                    </p>
                                                </div>
                                                {/* Déposé par - 20% */}
                                                <div className="w-[20%] min-w-0">
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {doc.uploader
                                                            ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() || '—'
                                                            : '—'}
                                                    </p>
                                                </div>
                                                {/* Actions - 10% */}
                                                <div className="w-[10%] flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {doc.mime_type.startsWith('image/') && (
                                                        <button
                                                            onClick={() => setDocumentPreview(doc)}
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

                {/* Completion status */}
                <section className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                        État de complétion
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className={`flex items-center gap-2 p-3 rounded-lg ${chantier.reserves_levees
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-slate-800/50 text-slate-400'
                                }`}
                        >
                            {chantier.reserves_levees ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm">Réserves levées</span>
                        </div>
                        <div
                            className={`flex items-center gap-2 p-3 rounded-lg ${chantier.doe_fourni
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-slate-800/50 text-slate-400'
                                }`}
                        >
                            {chantier.doe_fourni ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm">DOE fourni</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Photo Modal */}
            {photoModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setPhotoModal(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] p-2">
                        <button
                            onClick={() => setPhotoModal(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={photoModal}
                            alt="Photo agrandie"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {documentPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setDocumentPreview(null)}
                    data-testid="document-preview-modal"
                >
                    <div className="relative max-w-4xl max-h-[90vh] p-2">
                        <button
                            onClick={() => setDocumentPreview(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                            data-testid="btn-close-preview"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="bg-slate-900 rounded-lg p-4">
                            <p className="text-white font-medium mb-2" data-testid="preview-filename">{documentPreview.nom}</p>
                            {documentPreview.mime_type.startsWith('image/') && previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt={documentPreview.nom}
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
            {showDocumentModal && (
                <DocumentUploadModal
                    chantierId={chantier.id}
                    onClose={() => setShowDocumentModal(false)}
                    onSuccess={() => {
                        setShowDocumentModal(false);
                        setDocumentsRefresh((n) => n + 1);
                    }}
                />
            )}
        </div>
    );
}
