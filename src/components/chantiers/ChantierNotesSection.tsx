import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, FileText, X, Image, Pencil, Trash2 } from 'lucide-react';
import { supabase, isUsingMock } from '../../lib/supabase';
import type { Note } from './types';

interface ChantierNotesSectionProps {
    chantierId: string;
    defaultExpanded?: boolean;
    onPhotoClick?: (url: string) => void;
}

export function ChantierNotesSection({
    chantierId,
    defaultExpanded = true,
    onPhotoClick,
}: ChantierNotesSectionProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [notePhoto1, setNotePhoto1] = useState<string | null>(null);
    const [notePhoto2, setNotePhoto2] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const photo1InputRef = useRef<HTMLInputElement>(null);
    const photo2InputRef = useRef<HTMLInputElement>(null);

    // Fetch notes (excluding reserves which have their own section)
    useEffect(() => {
        const fetchNotes = async () => {
            const { data } = await supabase
                .from('notes_chantiers')
                .select('*')
                .eq('chantier_id', chantierId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            // Filter out reserves - they have their own section
            const filteredNotes = ((data as Note[]) || []).filter((n) => n.type !== 'reserve');
            setNotes(filteredNotes);
        };
        fetchNotes();
    }, [chantierId, refreshKey]);

    const resetForm = () => {
        setShowForm(false);
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
                const { error } = await supabase.from('notes_chantiers').insert([
                    {
                        chantier_id: chantierId,
                        contenu: noteContent || null,
                        photo_1_url: notePhoto1,
                        photo_2_url: notePhoto2,
                        created_by: userData?.user?.id || null,
                        deleted_at: null,
                    },
                ]);
                if (error) {
                    console.error('Insert error:', error);
                    alert('Erreur: ' + error.message);
                    return;
                }
            }

            resetForm();
            setRefreshKey((n) => n + 1);
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
        setShowForm(true);
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Supprimer cette note ?')) return;
        await supabase
            .from('notes_chantiers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', noteId);
        setRefreshKey((n) => n + 1);
    };

    // Process image file (compress and convert to base64)
    const processImageFile = (file: File, slot: 'photo1' | 'photo2') => {
        if (!file.type.startsWith('image/')) return;

        const maxSize = isUsingMock ? 300 : 800;
        const quality = isUsingMock ? 0.5 : 0.8;

        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (event) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
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

                const compressed = canvas.toDataURL('image/jpeg', quality);
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: 'photo1' | 'photo2') => {
        const file = e.target.files?.[0];
        if (file) processImageFile(file, slot);
    };

    const handleDrop = (e: React.DragEvent, slot: 'photo1' | 'photo2') => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) processImageFile(file, slot);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) {
                    if (!notePhoto1) {
                        processImageFile(file, 'photo1');
                    } else if (!notePhoto2) {
                        processImageFile(file, 'photo2');
                    }
                }
                break;
            }
        }
    };

    return (
        <section className="glass-card p-4" data-testid="section-informations">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-2 text-left"
                    data-testid="btn-toggle-informations"
                >
                    <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                            expanded ? '' : '-rotate-90'
                        }`}
                    />
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Informations
                        <span className="text-xs font-normal" data-testid="notes-count">
                            ({notes.length})
                        </span>
                    </h3>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowForm(true);
                        setExpanded(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                    title="Ajouter une note"
                    data-testid="btn-add-note"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {expanded && (
                <div className="mt-3 space-y-4">
                    {/* Formulaire inline d'ajout/édition de note */}
                    {showForm && (
                        <div className="border-t border-slate-700/50 pt-4 space-y-3" data-testid="note-form">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500 uppercase">
                                    {editingNote ? 'Modifier la note' : 'Nouvelle note'}
                                </p>
                                <button
                                    onClick={resetForm}
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
                            <div className="flex gap-2" onPaste={handlePaste}>
                                <div
                                    className="flex-1"
                                    onDrop={(e) => handleDrop(e, 'photo1')}
                                    onDragOver={handleDragOver}
                                >
                                    <input
                                        ref={photo1InputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'photo1')}
                                        className="hidden"
                                    />
                                    {notePhoto1 ? (
                                        <div className="relative">
                                            <img
                                                src={notePhoto1}
                                                alt="Photo 1"
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => setNotePhoto1(null)}
                                                className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => photo1InputRef.current?.click()}
                                            className="flex flex-col items-center gap-1 px-3 py-3 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-blue-500 text-sm cursor-pointer transition-colors"
                                        >
                                            <Image className="w-5 h-5" />
                                            <span className="text-xs">Photo 1</span>
                                            <span className="text-[10px] text-slate-500">Drop ou Ctrl+V</span>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="flex-1"
                                    onDrop={(e) => handleDrop(e, 'photo2')}
                                    onDragOver={handleDragOver}
                                >
                                    <input
                                        ref={photo2InputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'photo2')}
                                        className="hidden"
                                    />
                                    {notePhoto2 ? (
                                        <div className="relative">
                                            <img
                                                src={notePhoto2}
                                                alt="Photo 2"
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => setNotePhoto2(null)}
                                                className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => photo2InputRef.current?.click()}
                                            className="flex flex-col items-center gap-1 px-3 py-3 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-blue-500 text-sm cursor-pointer transition-colors"
                                        >
                                            <Image className="w-5 h-5" />
                                            <span className="text-xs">Photo 2</span>
                                            <span className="text-[10px] text-slate-500">Drop ou Ctrl+V</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={resetForm}
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
                                            {note.contenu || (
                                                <span className="italic text-slate-500">Pas de texte</span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {note.photo_1_url && (
                                                <img
                                                    src={note.photo_1_url}
                                                    alt="Photo 1"
                                                    className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80"
                                                    onClick={() => note.photo_1_url && onPhotoClick?.(note.photo_1_url)}
                                                />
                                            )}
                                            {note.photo_2_url && (
                                                <img
                                                    src={note.photo_2_url}
                                                    alt="Photo 2"
                                                    className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80"
                                                    onClick={() => note.photo_2_url && onPhotoClick?.(note.photo_2_url)}
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
    );
}
