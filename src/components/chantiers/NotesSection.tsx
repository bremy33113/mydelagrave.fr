import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, FileText, Image, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

type Note = Tables<'notes_chantiers'> & {
    creator?: { first_name: string | null; last_name: string | null } | null;
};

interface NotesSectionProps {
    chantierId: string;
}

import { ConfirmModal } from '../ui/ConfirmModal';

// ... other imports

export function NotesSection({ chantierId }: NotesSectionProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [content, setContent] = useState('');
    const [photo1, setPhoto1] = useState<string | null>(null);
    const [photo2, setPhoto2] = useState<string | null>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chantierId]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('notes_chantiers')
                .select('*, creator:users(first_name, last_name)')
                .eq('chantier_id', chantierId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            setNotes((data as Note[]) || []);
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setContent('');
        setPhoto1(null);
        setPhoto2(null);
        setEditingNote(null);
        setShowForm(false);
    };

    const openEditForm = (note: Note) => {
        setEditingNote(note);
        setContent(note.contenu || '');
        setPhoto1(note.photo_1_url);
        setPhoto2(note.photo_2_url);
        setShowForm(true);
    };

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        slot: 'photo1' | 'photo2'
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (slot === 'photo1') {
                setPhoto1(reader.result as string);
            } else {
                setPhoto2(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { data: userData } = await supabase.auth.getUser();

            const noteData = {
                chantier_id: chantierId,
                contenu: content || null,
                photo_1_url: photo1,
                photo_2_url: photo2,
                created_by: userData?.user?.id || null,
            };

            if (editingNote) {
                await supabase
                    .from('notes_chantiers')
                    .update({
                        contenu: content || null,
                        photo_1_url: photo1,
                        photo_2_url: photo2,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingNote.id);
            } else {
                await supabase.from('notes_chantiers').insert([noteData]);
            }

            resetForm();
            fetchNotes();
        } catch (err) {
            alert('Erreur: ' + (err as Error).message);
        }
    };

    const handleDelete = (noteId: string) => {
        setNoteIdToDelete(noteId);
        setShowDeleteModal(true);
    };

    const confirmDeleteNote = async () => {
        if (!noteIdToDelete) return;

        try {
            await supabase
                .from('notes_chantiers')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', noteIdToDelete);

            fetchNotes();
            setShowDeleteModal(false);
            setNoteIdToDelete(null);
        } catch {
            alert('Erreur lors de la suppression');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes ({notes.length})
                </h3>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter
                    </button>
                )}
            </div>

            {/* Add/Edit form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-4">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="input-field min-h-[100px] resize-none"
                        placeholder="Écrivez votre note..."
                    />

                    {/* Photo uploads */}
                    <div className="flex gap-4">
                        {[
                            { slot: 'photo1' as const, value: photo1, setValue: setPhoto1 },
                            { slot: 'photo2' as const, value: photo2, setValue: setPhoto2 },
                        ].map(({ slot, value, setValue }) => (
                            <div key={slot} className="flex-1">
                                {value ? (
                                    <div className="relative group">
                                        <img
                                            src={value}
                                            alt={`Photo ${slot === 'photo1' ? 1 : 2}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setValue(null)}
                                            className="absolute top-1 right-1 p-1 rounded bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500/50 cursor-pointer transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, slot)}
                                            className="hidden"
                                        />
                                        <div className="text-center text-slate-400">
                                            <Image className="w-6 h-6 mx-auto mb-1" />
                                            <span className="text-xs">Photo {slot === 'photo1' ? 1 : 2}</span>
                                        </div>
                                    </label>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={resetForm} className="btn-secondary text-sm py-1.5">
                            Annuler
                        </button>
                        <button type="submit" className="btn-primary text-sm py-1.5 flex items-center gap-1">
                            <Save className="w-4 h-4" />
                            {editingNote ? 'Enregistrer' : 'Ajouter'}
                        </button>
                    </div>
                </form>
            )}

            {/* Notes list */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : notes.length === 0 && !showForm ? (
                <div className="text-center py-8 text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune note pour ce chantier</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 group"
                        >
                            {/* Note content */}
                            {note.contenu && <p className="text-white whitespace-pre-wrap mb-3">{note.contenu}</p>}

                            {/* Photos */}
                            {(note.photo_1_url || note.photo_2_url) && (
                                <div className="flex gap-2 mb-3">
                                    {note.photo_1_url && (
                                        <img
                                            src={note.photo_1_url}
                                            alt="Photo 1"
                                            className="h-20 w-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setExpandedImage(note.photo_1_url)}
                                        />
                                    )}
                                    {note.photo_2_url && (
                                        <img
                                            src={note.photo_2_url}
                                            alt="Photo 2"
                                            className="h-20 w-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setExpandedImage(note.photo_2_url)}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-500">
                                    {note.creator && (
                                        <span>
                                            {note.creator.first_name} {note.creator.last_name} •{' '}
                                        </span>
                                    )}
                                    {formatDate(note.created_at)}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditForm(note)}
                                        className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image lightbox */}
            {expandedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setExpandedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                        onClick={() => setExpandedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={expandedImage}
                        alt="Expanded"
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setNoteIdToDelete(null);
                }}
                onConfirm={confirmDeleteNote}
                title="Supprimer la note"
                message="Voulez-vous vraiment supprimer cette note ?"
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    );
}
